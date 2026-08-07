# Cursor / VS Code 等 GUI 的 Git 常带精简 PATH，不含 shell 里的 node/pnpm。
# 供 pre-commit、commit-msg 在跑命令前加载。

if [ -d "$HOME/Library/pnpm" ]; then
	case ":$PATH:" in
	*":$HOME/Library/pnpm:"*) ;;
	*) PATH="$HOME/Library/pnpm:$PATH" ;;
	esac
fi

if [ -d "$HOME/.local/share/pnpm" ]; then
	case ":$PATH:" in
	*":$HOME/.local/share/pnpm:"*) ;;
	*) PATH="$HOME/.local/share/pnpm:$PATH" ;;
	esac
fi

if ! command -v node >/dev/null 2>&1; then
	export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
	# shellcheck disable=SC1091
	[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
fi

export PATH
