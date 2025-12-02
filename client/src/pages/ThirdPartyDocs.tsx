import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Types pour les onglets
type ThirdPartyDocsTab = 'dd-tech';

// Composants personnalisés pour le rendu Markdown (identique à About.tsx)
const MarkdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">
      {children}
    </h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-3 mb-2">
      {children}
    </h4>
  ),
  p: ({ children }: any) => (
    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
      {children}
    </p>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc mb-4 ml-6 space-y-2">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal mb-4 ml-6 space-y-2">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="text-gray-700 dark:text-gray-300 mb-1 pl-2">
      {children}
    </li>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-gray-900 dark:text-gray-100">
      {children}
    </strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-gray-700 dark:text-gray-300">
      {children}
    </em>
  ),
  code: (props: any) => {
    const { inline, children, className, ...rest } = props;
    const isCodeBlock = className?.includes('language-') || className?.includes('hljs');
    
    if (isCodeBlock) {
      return (
        <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono mb-4" {...rest}>
          {children}
        </code>
      );
    }
    
    if (inline === false) {
      return (
        <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono mb-4" {...rest}>
          {children}
        </code>
      );
    }
    
    return (
      <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200" {...rest}>
        {children}
      </code>
    );
  },
  pre: ({ children }: any) => (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
      {children}
    </pre>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 italic text-gray-600 dark:text-gray-400 my-4">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto mb-6">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-gradient-to-r from-blue-500 to-teal-500 dark:from-blue-600 dark:to-teal-600">
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
      {children}
    </tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
      {children}
    </td>
  ),
  hr: () => (
    <hr className="border-gray-300 dark:border-gray-600 my-8" />
  ),
};

const ThirdPartyDocs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ThirdPartyDocsTab>('dd-tech');
  const [ddTechContent, setDdTechContent] = useState<string>('');
  const [showCiecCategory, setShowCiecCategory] = useState<boolean>(false);

  // Charger dd-tech.md
  useEffect(() => {
    fetch('/docs/dd-tech.md')
      .then((res) => res.text())
      .then((text) => setDdTechContent(text))
      .catch((err) => {
        console.error('Erreur lors du chargement de la doc Tech DD:', err);
        setDdTechContent('# Technical Due Diligence\n\nDocumentation non disponible.');
      });
  }, []);

  // Injecter le style CSS pour masquer/afficher la colonne Catégorie CIEC
  useEffect(() => {
    const styleId = 'ciec-category-column-style';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    if (showCiecCategory) {
      styleElement.textContent = '';
    } else {
      // Masquer la dernière colonne (5ème colonne) des tableaux
      styleElement.textContent = `
        .markdown-content table th:nth-child(5),
        .markdown-content table td:nth-child(5) {
          display: none;
        }
      `;
    }
  }, [showCiecCategory]);

  const tabs = [
    { id: 'dd-tech' as ThirdPartyDocsTab, label: 'Tech DD - Mapping', icon: '📋' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dd-tech':
        return (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
              {ddTechContent || 'Chargement...'}
            </ReactMarkdown>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4 py-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Documentation Tiers</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Documentation technique de la holding Chapters
        </p>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg transition-colors">
        <nav className="flex space-x-1 px-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8 transition-colors">
        {/* Bouton pour afficher/masquer la colonne Catégorie CIEC */}
        {activeTab === 'dd-tech' && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowCiecCategory(!showCiecCategory)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
              title={showCiecCategory ? 'Masquer la colonne Catégorie CIEC' : 'Afficher la colonne Catégorie CIEC'}
            >
              {showCiecCategory ? '👁️ Masquer Catégorie CIEC' : '👁️‍🗨️ Afficher Catégorie CIEC'}
            </button>
          </div>
        )}
        {renderTabContent()}
      </div>

      {/* Footer note */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p>Documentation Chapters - Tech Health Platform</p>
      </div>
    </div>
  );
};

export default ThirdPartyDocs;

