import React from 'react';

const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header avec logo */}
      <div className="text-center space-y-6 py-8">
        <div className="flex justify-center">
          <img
            src="/Final_visual.png"
            alt="Tech Health Platform Logo"
            className="h-32 w-auto object-contain"
          />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Tech Health Platform</h1>
        <p className="text-xl text-gray-600">
          Standardized Technical Health Assessment and Monitoring Platform
        </p>
      </div>

      {/* Introduction */}
      <section className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg p-6 md:p-8 border border-blue-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
        <p className="text-gray-700 leading-relaxed">
          This project aims to establish a <strong>centralized and standardized platform</strong> for 
          the evaluation, quantification, and monitoring of the <strong>technical health</strong> of 
          niche software publishers (current and acquisition targets) in the investment fund's portfolio.
        </p>
        <p className="text-gray-700 leading-relaxed mt-4">
          The platform is designed to support two main use cases: pre-acquisition evaluation through 
          the <strong>"Technical DD"</strong> (Technical Due Diligence) view and continuous monitoring 
          of technical issues post-acquisition.
        </p>
      </section>

      {/* Objectives */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Objectives and Key Features</h2>
        <p className="text-gray-700 leading-relaxed">
          The main objective is to provide a <strong>standardized score</strong> and analytical views 
          to prioritize remediation actions, security audits, and investments in modernization or consolidation.
        </p>

        {/* Scoring Engine */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            Scoring Engine and Rating
          </h3>
          <p className="text-gray-700 mb-4">
            Scoring is calculated by a backend service (<code className="bg-gray-100 px-2 py-1 rounded text-sm">Scoring Engine</code>) 
            that generates a snapshot (<code className="bg-gray-100 px-2 py-1 rounded text-sm">ScoringSnapshot</code>) of technical maturity. 
            The global score (0–100) is broken down according to the following weighted categories:
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-500 to-teal-500">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Target Weight
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Security</td>
                  <td className="px-4 py-3 text-sm text-gray-700">30%</td>
                  <td className="px-4 py-3 text-sm text-gray-600">Audit, Authentication (MFA/SSO), Penetration testing</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Resilience & Continuity</td>
                  <td className="px-4 py-3 text-sm text-gray-700">20%</td>
                  <td className="px-4 py-3 text-sm text-gray-600">Backup (RTO/RPO), Redundancy, DRP</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Compliance & Certifications</td>
                  <td className="px-4 py-3 text-sm text-gray-700">20%</td>
                  <td className="px-4 py-3 text-sm text-gray-600">GDPR, ISO 27001, HDS, Ségur, SOX/SOC1</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Observability & Operations</td>
                  <td className="px-4 py-3 text-sm text-gray-700">15%</td>
                  <td className="px-4 py-3 text-sm text-gray-600">Performance monitoring, Log centralization</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Architecture & Scalability</td>
                  <td className="px-4 py-3 text-sm text-gray-700">15%</td>
                  <td className="px-4 py-3 text-sm text-gray-600">Deployment type, Scaling capacity</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Collection and Views */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Collection and Views (Frontend)
          </h3>
          <p className="text-gray-700 mb-4">
            The application supports two key user interfaces:
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-teal-500 mr-2">•</span>
              <div>
                <strong className="text-gray-900">Collector UI:</strong> Guided form (stepper) using 
                <em> Progressive Disclosure</em> for progressive data collection (priorities P1 to P5).
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-teal-500 mr-2">•</span>
              <div>
                <strong className="text-gray-900">Portfolio View:</strong> Enables comparison, filtering, 
                and display of <em>heatmaps</em> (maturity / risk / costs) for all solutions in the group.
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-teal-500 mr-2">•</span>
              <div>
                <strong className="text-gray-900">Technical DD View:</strong> Aggregated view of all 
                relevant fields for pre-acquisition evaluation.
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Technical Architecture */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Technical Architecture</h2>
        <p className="text-gray-700 leading-relaxed">
          The platform is based on a Monorepo architecture using TypeScript for consistency between 
          frontend and backend. The API is built around GraphQL for maximum flexibility in data retrieval.
        </p>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-500 to-teal-500">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Component
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Technology
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Frontend</td>
                <td className="px-4 py-3 text-sm text-gray-700">React.js + TypeScript</td>
                <td className="px-4 py-3 text-sm text-gray-600">User interface (UI Collector and Dashboard)</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Backend API</td>
                <td className="px-4 py-3 text-sm text-gray-700">Node.js + Express.js</td>
                <td className="px-4 py-3 text-sm text-gray-600">Business logic, Scoring engine</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">API Layer</td>
                <td className="px-4 py-3 text-sm text-gray-700">GraphQL (Apollo Server)</td>
                <td className="px-4 py-3 text-sm text-gray-600">Flexible queries for complex views (DD, Portfolio)</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Database</td>
                <td className="px-4 py-3 text-sm text-gray-700">MongoDB</td>
                <td className="px-4 py-3 text-sm text-gray-600">Storage of DD/CIEC data (semi-structured/evolutive schema)</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Infrastructure</td>
                <td className="px-4 py-3 text-sm text-gray-700">OVHCloud VPS + Docker</td>
                <td className="px-4 py-3 text-sm text-gray-600">Containerized deployment in France</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Dev Tools</td>
                <td className="px-4 py-3 text-sm text-gray-700">GitHub Actions</td>
                <td className="px-4 py-3 text-sm text-gray-600">CI/CD and automation</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Data Model */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Data Model (Due Diligence Focus)</h2>
        <p className="text-gray-700 leading-relaxed">
          The data model merges the CIEC inventory with entities specific to technical DD to capture 
          governance and process aspects.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg p-5 border border-blue-100">
            <h4 className="font-semibold text-gray-900 mb-2">Codebase</h4>
            <p className="text-sm text-gray-700">
              Captures source code management, documentation level, critical dependencies, known technical debt, 
              and legacy systems management.
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg p-5 border border-blue-100">
            <h4 className="font-semibold text-gray-900 mb-2">DevelopmentMetrics</h4>
            <p className="text-sm text-gray-700">
              Integrates critical DevOps metrics: SDLC process, CI/CD automation level, planned/unplanned ratio, 
              MTTR, and Lead Time for Changes.
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg p-5 border border-blue-100">
            <h4 className="font-semibold text-gray-900 mb-2">AIFeatures</h4>
            <p className="text-sm text-gray-700">
              Evaluates AI solutions (use of external services vs. proprietary models, quality validation, 
              and continuous improvement).
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg p-5 border border-blue-100">
            <h4 className="font-semibold text-gray-900 mb-2">SecurityProfile</h4>
            <p className="text-sm text-gray-700">
              Tracks recent audits, known security flaws, and security incident management processes.
            </p>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg p-6 md:p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Project Summary</h2>
        <p className="leading-relaxed opacity-95">
          The <strong>Tech-Health-Platform</strong> is the CTO's strategic tool for standardizing the technical 
          evaluation of niche software publishers, essential both for Technical Due Diligence before acquisition 
          and for continuous monitoring of existing entities. The unified system brings together operational 
          indicators (CIEC) and governance (DD) within a flexible data model, based on entities such as 
          <code className="bg-white/20 px-2 py-1 rounded text-sm">Codebase</code> and 
          <code className="bg-white/20 px-2 py-1 rounded text-sm">DevelopmentMetrics</code>. This model enables 
          evaluation of critical aspects such as technical debt, development processes (MTTR), and management of 
          innovations like AI (<code className="bg-white/20 px-2 py-1 rounded text-sm">AIFeatures</code>).
        </p>
        <p className="leading-relaxed opacity-95 mt-4">
          Technically, the platform relies on a modern and performant stack, favoring <strong>React.js and 
          Node.js/TypeScript</strong> in a <strong>GraphQL</strong>-oriented architecture to guarantee the flexibility 
          necessary for creating complex analytical views (such as the <em>heatmaps</em> of the "Portfolio View"). 
          Persistence is ensured by <strong>MongoDB</strong>, adapted to the evolving schemas inherent to technical 
          evaluation. Deployment on <strong>OVHCloud VPS</strong> in France ensures stable infrastructure and 
          data governance under control, responding to sovereignty and hosting mutualization challenges observed 
          within the portfolio.
        </p>
      </section>

      {/* Footer note */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
        <p>Centre d'Opérations Techniques (COT) - Tech Health Platform</p>
      </div>
    </div>
  );
};

export default About;

