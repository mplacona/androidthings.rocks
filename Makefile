JEKYLL = docker run -ti --rm -v "$(shell pwd):/srv/jekyll" -p 4001:4001 jekyll/jekyll
RUNNER = `whoami`
COMMIT = `git rev-parse --short HEAD`

test:
	@${JEKYLL} bundle exec jekyll serve --watch -H 0.0.0.0 --drafts --trace

build: clean
	@echo "Building site"
	@${JEKYLL} bundle exec jekyll build

# deploy: build
# 	@git checkout master
# 	@sudo chown -R ${RUNNER}. _site && sudo cp -r _site/* . && sudo rm -rf _*/
# 	@git add --all . && git commit -m "Jekyll deployment from commit ${COMMIT}"
# 	@echo "You can now push master"
# 	@echo "Once everything is valid, git checkout develop && sudo git clean -f -d"
# 	@python -m SimpleHTTPServer 4000

clean:
	@rm -rf _site