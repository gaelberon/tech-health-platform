// Fichier : /client/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // Pour importer les styles TailwindCSS
import './i18n/config'; // Initialiser i18n
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client'; // Installation précédente

// L'URI standard pour le backend Apollo Server en environnement de développement
const GRAPHQL_URI = 'http://localhost:4000/graphql';

const httpLink = createHttpLink({
  uri: GRAPHQL_URI,
  credentials: 'include',
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* ApolloProvider enveloppe l'application, rendant les données GraphQL accessibles partout */}
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
);
