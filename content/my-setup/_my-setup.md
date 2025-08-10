This page helps me when setting up a new computer, and provides an overview to assess for consistency and compatibility.

# Hardware

- Computer: Mac Mini (2024) M4 10 core, 32GB RAM, 512GB SSD
- Monitor: BenQ PD27305
- Keyboard: NuPhy Air75 V2, with caps-lock configured as escape

# Software management

- Package management: [brew](https://brew.sh)
- Python versions and virtualenv: [uv](https://docs.astral.sh/uv/)
- Containers / virtual machines: [container](https://github.com/apple/container), [colima](https://github.com/abiosoft/colima), [docker](https://www.docker.com), and [qemu](https://www.qemu.org)

# Desktop

- Focus behaviour: [AutoRaise](https://github.com/sbmpost/AutoRaise)
- Launcher (Spotlight replacement): [Raycast](https://www.raycast.com)

# Programming

- Editor: [Helix](https://helix-editor.com)
- Terminal : [Ghostty](https://ghostty.org)
- Shell: [Fish](https://fishshell.com)
- Terminal prompt: [Starship](https://starship.rs)
- Git: [LazyGit](https://github.com/jesseduffield/lazygit)
- Python code quality: [Ruff](https://docs.astral.sh/ruff/) and [ty](https://github.com/astral-sh/ty)
- Javascript/Typescript: [Bun](https://bun.sh)

# Data Science

- Python notebooks: [Marimo](https://marimo.io)
- Dataframes: [Polars](https://pola.rs) and [DuckDB](https://duckdb.org)
- Visualisations: [Vega-Altair](https://altair-viz.github.io)

# LLMs

- Local models: [Ollama](https://ollama.ai)
- Remote models: [OpenRouter](https://openrouter.ai)
- Commandline: [LLM](https://llm.datasette.io)
- Programming: [Aider](https://aider.chat)

# Researching and writing

- Writing (PDFs): [typst](https://typst.app)
- Research notes: [Zotero](https://www.zotero.org)
- General notes: Apple notes

# Apps

To install all apps (list created using `brew list --casks -1`):

```bash
brew install -q --cask \
    font-fira-code \
    font-fira-code-nerd-font \
    font-noto-emoji \
    ghostty \
    raycast \
    zotero
```

Note this includes the [Fira Code](https://github.com/tonsky/FiraCode) font with programming ligatures.

# Commandline tools

To install all my usual packages (list created using `brew leaves -r`):
```bash
brew install -q \
    bat \
    bottom \
    colima \
    curl \
    docker \
    duckdb \
    dust \
    eza \
    fastfetch \
    fd \
    ffmpeg \
    fish \
    fzf \
    git \
    helix \
    jq \
    lazygit \
    libffi \
    mkcert \
    neovim \
    oven-sh/bun/bun \
    qemu \
    ripgrep \
    sqlite \
    starship \
    tidy-html5 \
    uv \
    zlib 
```

Note the better versions of standard tools:
- `cat` → [bat](https://github.com/sharkdp/bat)
- `ls` → [eza](https://eza.rocks)
- `du` → [dust](https://github.com/bootandy/dust)
- `top` → [bottom (btm)](https://clementtsang.github.io/bottom/stable/)
- `grep` → [fzf](https://junegunn.github.io/fzf) and [ripgrep](https://github.com/BurntSushi/ripgrep)
- `find` → [fd](https://github.com/sharkdp/fd)

# Configuration

## Ghostty

Open settings to set:
```
macos-option-as-alt = left
split-divider-color = white
```
    
## Fish

The main `~/.config/fish/config.fish` contains:

```
if status --is-login
    # For brew
    fish_add_path -P /opt/homebrew/bin
    brew shellenv fish | source

    # For uv
    uv generate-shell-completion fish | source

    # Add standard unix paths
    fish_add_path -P /usr/local/sbin /usr/sbin /sbin /usr/local/bin /usr/bin /bin

    # Add path to brew-installed curl
    fish_add_path -P (brew --prefix)/opt/curl/bin

    # Add path to anything I have installed locally (e.g. by `uv tool`)
    fish_add_path -P /Users/tcorbettclark/.local/bin

    # Set library path and dynamic library path
    set -x -g LD_LIBRARY_PATH (brew --prefix)/opt/curl/lib (brew --prefix)/lib /usr/lib /lib
    set -x -g DYLD_LIBRARY_PATH (brew --prefix)/opt/curl/lib (brew --prefix)/lib /usr/lib /lib
end

# Make starfish manage the prompt always.
starship init fish | source
```

Some handy aliases:

```bash
alias --save ls eza
alias --save la 'ls -a'
alias --save ll 'ls -l'
alias --save lla 'ls -la'
alias --save lt 'ls --tree'
alias --save va 'source .venv/bin/activate.fish'
alias --save copy-latest-pdf-download 'cp (ls --sort created ~/Downloads/*.pdf | tail -1)'
```

# Tips

## Brew

Add the [brew-cache](https://github.com/ten0s/homebrew-brew-cache) extension to make it easy to find which packages own which files:

```bash
brew tap ten0s/homebrew-brew-cache
```

In addition to the usual `brew update/upgrade/install/uninstall/list/info`:

```bash
brew cache -u                             # Create/update cache of files
brew cache -s <file pattern>              # Find packages containing files/directories matching pattern

brew leaves                               # Packages which are not dependencies of other packages
brew leaves -r                            # ...installed manually
brew leaves -p                            # ...installed as dependencies

brew deps --tree <package>                # Dependencies of <package>
brew deps --tree --installed              # ...all packages
brew deps --tree (brew leaves -r)         # ...all manually installed packages, avoiding duplications
brew deps --tree (brew list --casks -1)   # ...all casks

brew autoremove --dry-run                 # Remove (dry run) packages no longer required
brew cleanup -s                           # Remove old versions of packages and cache files

brew doctor                               # Find potential issues
```

## Fish

Find changes made to fish configuration, functions, completions etc since installation:

```bash
fish_delta
```
