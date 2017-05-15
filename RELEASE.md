# How to Release

This project is hosted on NPM.  You can see it [here][project-url].

Releasing the project requires these steps:

0. Set the version number in the code
1. `npm run build` (make sure no errors)
2. Use a GitHub [project release][github-release-url] to release the project and tag (be sure it follows [semver][semantic-versioning])
3. `npm publish` (make sure it's uploaded to [npm][project-url])
4. Update `master` to a new minor version

[project-url]: https://www.npmjs.com/package/xfc
[semantic-versioning]: http://semver.org/
[github-release-url]: https://help.github.com/articles/creating-releases/
