# Smart Safe

![license](https://img.shields.io/github/license/mistswapdex/safe-react)

The most trusted platform to store digital assets on smartBCH. More info at [smartsafe.cash](https://smartsafe.cash/). Built on top of [Gnosis Safe](https://gnosis-safe.io).

For technical information please refer to the [Gnosis Developer Portal](https://docs.gnosis.io/safe/).

For support requests, please open up a [bug issue](https://github.com/mistswapdex/safe-react/issues/new?template=bug-report.md) or reach out via [Discord](https://discord.gg/mistswapdex).

## Transactions

Please see the [transaction](docs/transactions.md) notes for more information about transaction details.

## Related repos

- [safe-react-e2e-tests](https://github.com/gnosis/safe-react-e2e-tests)
- [safe-react-gateway-sdk](https://github.com/gnosis/safe-react-gateway-sdk)
- [safe-react-components](https://github.com/gnosis/safe-react-components)

## Deployed environments

- Production: https://smartsafe.cash | https://safe.mistswap.fi

## Getting Started

These instructions will help you get a copy of the project up and running on your local machine for development and testing purposes. See [Deployment](#deployment) for notes on how to deploy the project on a live system.

### Prerequisites

We use [yarn](https://yarnpkg.com) in our infrastructure, so we decided to go with yarn in the README.
Please install yarn globally if you haven't already.

### Environment variables

The app grabs environment variables from the `.env` file. Copy our template to your own local file:

```
cp .env.example .env
```

Once done, you'll need to restart the app if it's already running.

### Installing and running

Install dependencies for the project:

```
yarn install
```

To launch the dev version of the app locally:

```
yarn start
```

Alternatively, to run the production version of the app:

```
yarn build
mv build app
python -m SimpleHTTPServer 3000
```

And open http://localhost:3000/app in the browser.

### Docker

If you prefer to use Docker:

```
docker-compose build && docker-compose up
```

### Building

To get a complete bundle using the current configuration use:

```
yarn build
```

## Running the tests

To run the tests:

```
yarn test
```

### Lint

ESLint will be run automatically before you commit. To run it manually:

```
yarn lint:fix
```

## Deployment

### Dev & staging

The code is deployed to a testing website automatically on each push via a GitHub Action.
The GitHub Action will create a new subdomain and post the link as a comment in the PR.

### Production

Deployment to production is done manually. Please see the [release procedure](docs/release-procedure.md) notes for details.

## Built With

- [React](https://reactjs.org/) - A JS library for building user interfaces
- [Material UI 4.X](https://material-ui.com/) - React components that implement Google's Material Design
- [redux, immutable, reselect, final-form](https://redux.js.org/) - React ecosystem libraries

![app diagram](https://user-images.githubusercontent.com/381895/129330828-c067425b-d20b-4f67-82c7-c0598deb453a.png)

## Contributing

Please fork this repo and create a new branch with the name of your feature/bugfix and send a PR.

## Versioning

We use [SemVer](https://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/gnosis/gnosis-team-safe/tags).

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
