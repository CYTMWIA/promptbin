'use client';

import { useState, useEffect } from 'react';
import { Plus, Settings, Trash2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Repository, getRepos, deleteRepo, setDefaultRepo, getDefaultRepoId } from './lib/repos';
import { PromptIndexItem, getPromptsForDefaultRepo, deletePrompt } from './lib/prompt-storage';
import AddRepoView from './components/AddRepoView';
import CreatePromptView from './components/CreatePromptView';
import PromptView from './components/PromptView';

type View = 'home' | 'add-repo' | 'create-prompt' | 'prompt';

interface PromptState {
  path: string;
}

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [repos, setRepos] = useState<Repository[]>(() => getRepos());
  const [prompts, setPrompts] = useState<PromptIndexItem[]>([]);
  const [promptState, setPromptState] = useState<PromptState | null>(null);
  const [repoToDelete, setRepoToDelete] = useState<string | null>(null);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Hydration guard: prevents SSR/client mismatch when reading localStorage
    // react-hooks/set-state-in-effect warning is expected and acceptable here
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    getPromptsForDefaultRepo().then(setPrompts);
  }, [repos]);

  const handleDeleteRepo = (id: string) => {
    deleteRepo(id);
    setRepos(getRepos());
  };

  const handleSetDefault = (id: string) => {
    setDefaultRepo(id);
    setRepos(getRepos());
  };

  const handleDeletePrompt = async (path: string) => {
    const defaultId = getDefaultRepoId();
    if (defaultId) {
      try {
        await deletePrompt(defaultId, path);
        setPrompts(await getPromptsForDefaultRepo());
        toast.success('Prompt deleted');
      } catch {
        toast.error('Failed to delete prompt');
      }
    }
  };

  const handleOpenPrompt = (prompt: PromptIndexItem) => {
    setPromptState({ path: prompt.path });
    setCurrentView('prompt');
  };

  const defaultRepoId = getDefaultRepoId();
  const defaultRepo = repos.find(r => r.id === defaultRepoId);

  if (!isMounted) {
    return (
      <div className="flex h-screen">
        <div className="w-[260px] border-r bg-background" />
        <main className="flex-1 p-8 md:p-12 lg:p-16">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">promptbin</h1>
          <p className="text-muted-foreground mt-3 text-lg">Loading...</p>
        </main>
      </div>
    );
  }

    return (
      <>
        <SidebarProvider>
      <Sidebar side="left" collapsible="icon" variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setCurrentView('create-prompt')} tooltip="Create Prompt">
                <Plus />
                <span>Create Prompt</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Prompts</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {prompts.map((prompt) => (
                  <SidebarMenuItem key={prompt.path}>
                    <SidebarMenuButton onClick={() => handleOpenPrompt(prompt)}>
                      {prompt.title}
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      showOnHover
                      className="hover:bg-red-100 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPromptToDelete(prompt.path);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton tooltip={defaultRepo?.name || 'Repos'}>
                    <Settings />
                    <span>{defaultRepo?.name || 'Repos'}</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-56">
                  {repos.map((repo) => (
                    <DropdownMenuItem
                      key={repo.id}
                      onClick={() => handleSetDefault(repo.id)}
                      className={repo.id === defaultRepoId ? 'bg-primary/10' : ''}
                    >
                      {repo.name}
                      {repos.length > 1 && (
                        <DropdownMenuShortcut
                          onClick={(e) => {
                            e.stopPropagation();
                            setRepoToDelete(repo.id);
                          }}
                          className="cursor-pointer hover:bg-red-100 hover:text-red-600 rounded-md p-1"
                        >
                          <Trash2 className="size-4 text-inherit" />
                        </DropdownMenuShortcut>
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={() => setCurrentView('add-repo')}>
                    <Plus className="size-4 mr-2" />
                    Add Repository
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <main className="flex-1 p-8 md:p-12 lg:p-16">
          {currentView === 'home' ? (
            <>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">promptbin</h1>
              <p className="text-muted-foreground mt-3 text-lg">Store and manage your prompts</p>
            </>
          ) : currentView === 'add-repo' ? (
            <AddRepoView onSuccess={() => {
              setRepos(getRepos());
              setCurrentView('home');
            }} />
          ) : currentView === 'create-prompt' ? (
            <CreatePromptView onSuccess={async (path) => {
              setPrompts(await getPromptsForDefaultRepo());
              setPromptState({ path });
              setCurrentView('prompt');
            }} />
          ) : currentView === 'prompt' && promptState && defaultRepoId ? (
            <PromptView
              repoId={defaultRepoId}
              path={promptState.path}
              onUpdate={async () => {
                setPrompts(await getPromptsForDefaultRepo());
              }}
            />
          ) : null}
        </main>
      </SidebarInset>
    </SidebarProvider>

    <AlertDialog open={repoToDelete !== null} onOpenChange={(open) => !open && setRepoToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Repository</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{repos.find(r => r.id === repoToDelete)?.name}&quot;?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setRepoToDelete(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            if (repoToDelete) {
              handleDeleteRepo(repoToDelete);
              setRepoToDelete(null);
            }
          }}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={promptToDelete !== null} onOpenChange={(open) => !open && setPromptToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{prompts.find(p => p.path === promptToDelete)?.title}&quot;?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPromptToDelete(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            if (promptToDelete) {
              handleDeletePrompt(promptToDelete);
              setPromptToDelete(null);
            }
          }}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Toaster theme="system" position="top-center" toastOptions={{ duration: 3000 }} />
    </>
  );
}
