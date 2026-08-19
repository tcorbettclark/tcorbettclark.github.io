This page helps me when setting up a new computer, and provides an overview to assess for consistency and compatibility.

My main development is done using [my devbox](https://github.com/tcorbettclark/devbox) to provide a consistent environment using Apple container machines.

## Hardware

- Computer: Mac Mini (2024) M4 10 core, 32GB RAM, 512GB SSD
- Monitor: BenQ PD27305
- Keyboard: NuPhy Air75 V2, with caps-lock configured as escape

## Software management

- Package management: [brew](https://brew.sh)
- Python versions and virtualenv: [uv](https://docs.astral.sh/uv/)
- Containers/VMs: [container](https://github.com/apple/container) (using my [devbox](https://github.com/tcorbettclark/devbox))

## Desktop

- Computer monitoring: [Stats](https://github.com/exelban/stats)
- Display management: [Betterdisplay](https://github.com/waydabber/betterdisplay)
- Launcher (Spotlight replacement): [Raycast](https://www.raycast.com)
- Sleep control: [Jolt of Caffeine](https://apps.apple.com/gb/app/jolt-of-caffeine/id1437130425?mt=12)

## Programming

- Editor: [Zed](https://zed.dev)
- Terminal : [Ghostty](https://ghostty.org)
- Shell: [Fish](https://fishshell.com)
- Terminal prompt: [Starship](https://starship.rs)
- Git: [LazyGit](https://github.com/jesseduffield/lazygit)
- Python code quality: [Ruff](https://docs.astral.sh/ruff/) and [ty](https://github.com/astral-sh/ty)
- Javascript/Typescript: [Bun](https://bun.sh)

## Data Science

- Python notebooks: [Marimo](https://marimo.io)
- Dataframes: [Polars](https://pola.rs) and [DuckDB](https://duckdb.org)
- Visualisations: [Vega-Altair](https://altair-viz.github.io)

## LLMs

- Local models: [Ollama](https://ollama.com)
- Remote models: [Ollama](https://ollama.com) and [OpenRouter](https://openrouter.ai)
- Commandline: [LLM](https://llm.datasette.io)
- Programming: [Pi](https://pi.dev)

## Researching and writing

- Writing (PDFs): [typst](https://typst.app)
- Research notes: [Zotero](https://www.zotero.org)
- General notes: Apple notes

## Apps

To install all apps (list created using `brew list --casks -1`):

```bash
brew install -q --cask \
    betterdisplay \
    caskhub \
    font-fira-code \
    font-fira-code-nerd-font \
    font-noto-emoji \
    ghostty \
    mos \
    raycast \
    shottr \
    stats \
    zed \
    zotero
```

Note this includes the [Fira Code](https://github.com/tonsky/FiraCode) font with programming ligatures.

## Commandline tools

To install all my usual packages (list created using `brew leaves -r`):
```bash
brew install -q \
    agg \
    bat \
    bottom \
    caddy \
    chezmoi \
    container \
    curl \
    doctl \
    duckdb \
    dust \
    eza \
    fastfetch \
    fd \
    ffmpeg \
    fish \
    fzf \
    gh \
    git \
    harper \
    herdr \
    jq \
    lazygit \
    libiconv \
    mailpit \
    mkcert \
    node \
    nss \
    oven-sh/bun/bun \
    ripgrep \
    starship \
    uv \
    worktrunk \
    zlib
```

Note the better versions of standard tools:
- `cat` → [bat](https://github.com/sharkdp/bat)
- `ls` → [eza](https://eza.rocks)
- `du` → [dust](https://github.com/bootandy/dust)
- `top` → [bottom (btm)](https://clementtsang.github.io/bottom/stable/)
- `grep` → [fzf](https://junegunn.github.io/fzf) and [ripgrep](https://github.com/BurntSushi/ripgrep)
- `find` → [fd](https://github.com/sharkdp/fd)


Global python tools managed by uv:
```bash
uv tool install \
    llm \
    rapid-mlx \
    ruff \
    semble \
    site-sweeper-cli \
    ty \
    vale
```

## Configuration

My dotfiles configuration is managed by [chezmoi](https://www.chezmoi.io) in [tcorbettclark/dotfiles](https://github.com/tcorbettclark/dotfiles).

## Tips

### Brew

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

### Fish

Find changes made to fish configuration, functions, completions etc since installation:

```bash
fish_delta
```
