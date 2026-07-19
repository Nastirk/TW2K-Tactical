export interface FoundryDialogButtonLike {
  label: string;
  callback?: (html: unknown) => unknown;
}

export interface FoundryDialogConfigLike {
  title: string;
  content: string;
  buttons: Record<string, FoundryDialogButtonLike>;
  default?: string;
  close?: () => void;
}

export interface FoundryDialogClassLike {
  new (config: FoundryDialogConfigLike): {
    render(force?: boolean): unknown;
  };
}
