.PHONY: build
build: ## Build CSS
	sass src/base.scss theme.css --no-source-map --no-charset
	sass src/base.scss obsidian.css --no-source-map --no-charset

.PHONY: help
help: ## Display help
	@awk -F ':|##' '/^[^\t].+?:.*?##/ {printf "\033[36m%-30s\033[0m %s\n", $$1, $$NF}' $(MAKEFILE_LIST) | sort
