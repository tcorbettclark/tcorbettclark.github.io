TODO: Refer/raid my github for computer configuration

# Editor and Terminal

Zed

Not iterm2 any more, because never used all the features, but alacritty.org
Often just use the terminal built into Zed (which is alacritty)
See .alacritty.toml

https://fishshell.com/docs/current/design.html

Check fish_delta

TODO explain where I installed brew (and find out if that was actually a good idea!)

brew install lsd
alias la 'ls -a'
alias ll 'ls -l'
alias lla 'ls -la'
alias ls lsd
alias lt 'ls --tree'

https://gist.github.com/jamesmurdza/6e5f86bae7d3b3db4201a52045a5e477#see-dependency-tree

# Odds

[AutoRaise application](https://github.com/sbmpost/AutoRaise)

# Keyboard

- ⌥ is Option/Alt
- ⌘ is Command/Cmd
- 🌐︎ is Fn/Globe

Use Karabiner-eventviewer to watch events
Also https://keycode.info/

I have configured using Karabiner to make

- The Windows button into Command/Cmd (was Option/Alt)
- The Alt button into Option/Alt (was Command/Cmd)
- The Application button into (right) option.
- (The Fn key does nothing)

So the modifier buttons are now:

Ctrl ⌥ ⌘ \<space\> ⌘ Fn ⌥ Ctrl

And make sure keyboard is set to British, and not to Unicode Hex Input!

# Shell

bat - syntax aware cat
eza - (instead of lsd) for smarter ls
dust - better du to understand disk usage
bottom (btm) - better top
