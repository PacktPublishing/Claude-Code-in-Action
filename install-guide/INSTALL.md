# Installing Claude Code on macOS / Linux

---

**1.** Press `Command + Space` to open Spotlight search, then type "Terminal" and open it.

**2.** Check whether Git is installed. Type the following in the terminal and press Enter:

```bash
git --version
```

If a version number appears, Git is already installed. macOS usually ships with Git included. (If it is not installed, an installation popup will appear — click "Install", or type `xcode-select --install` in the terminal to start the installation.)

**3.** Once Git is confirmed, type the following command in the terminal and press Enter:

```bash
curl -fsSL https://claude.ai/install.sh | zsh
```

> **Note**: If needed, replace `zsh` at the end of the command with `bash`. `zsh` and `bash` refer to your operating system's default shell (macOS uses zsh; most Linux distributions use bash).

**4.** When the Claude Code installation confirmation appears, quit the terminal with `Command + Q` and open it again. You can now type `claude` at the prompt to launch Claude.

> **Note**: If you get a "claude not found" error, register the PATH manually as shown below, then restart the terminal and run `claude` again.
> ```bash
> echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
> source ~/.zshrc
> ```
