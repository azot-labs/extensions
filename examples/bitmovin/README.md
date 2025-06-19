# Azot Extension Example

In this example we have a simple implementation of [Azot](https://azot.so) extension that adds support for downloading video from [Bitmovin](https://bitmovin.com/demos/drm/).

Extension can be added to Azot via `install` command from direct URL or from local path.

Supported formats for distribution are `zip` and `tgz`.

## Install

[Node.js](https://nodejs.org/en/) is required.

Clone this repository.

Install dependencies:

```shell
npm install
```

## Development

Main file is `bitmovin.js`, it contains all necessary code to support downloading video from [Bitmovin](https://bitmovin.com/demos/drm/). You can use it as a template for your own extension.

## Testing

File `bitmovin.test.js` contains a couple of tests. It can be useful for debugging while you developing your own script.

```shell
npm test
```

## Distribution

### Local

Pack your code:

```shell
npm pack
```

Results will be `tgz` and `zip` files. You can share any of this files to distribute extension.

### Remote via GitHub

Publish your code to GitHub.

Create release in GitHub Releases section with assets.

Then you can simply add extension by package name via `install` Azot command:

```shell
azot install github:username/repo
```
