# babel-env

CLI interface for Babel + @babel/preset-env.

## Install

This package is meant to be installed globally.

```sh
npm install babel-env-cli --global
```

## Usage

```
Usage
  $ babel-env <input.js>

Options
  -o, --output Output file
  -w, --watch  Watch JS source directory for changes

Example
  $ babel-env src/input.js -o dist/output.js
  $ babel-env src/input.js -o dist/output.js --watch
```

## Related

- [`Babel`](https://babeljs.io/)
- [`@babel/core`](https://babeljs.io/docs/en/babel-core)
- [`@babel/preset-env`](https://babeljs.io/docs/en/babel-preset-env)
- [`@babel/cli`](https://babeljs.io/docs/en/babel-cli)

## License

MIT
