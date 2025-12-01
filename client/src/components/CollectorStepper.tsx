// Fichier : /client/src/components/CollectorStepper.tsx

import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import AssistanceTooltip from './AssistanceTooltip';
import { GET_P1_LOOKUPS } from '../graphql/queries';

// // Nous importons chaque type P1 depuis son fichier modèle, en utilisant le chemin complet
// // L'alias @common pointe maintenant vers le dossier /common/
// import { CriticalityLevel } from '@common/types/Editor.model'; 
// import { SolutionType } from '@common/types/Solution.model'; 
// import { HostingTier } from '@common/types/Hosting.model'; 
// import { DataTypes, RedundancyLevel } from '@common/types/Environment.model'; 

// Note: Les types sont maintenant chargés dynamiquement via les lookups depuis MongoDB

// Définition de la mutation (utiliser le contenu de /client/src/graphql/mutations.ts)
const CREATE_SOLUTION_ENVIRONMENT_P1 = gql`
  mutation CreateSolutionEnvironmentP1(
    $editorInput: EditorInputP1!
    $solutionInput: SolutionInputP1!
    $hostingInput: HostingInputP1!
    $environmentInput: EnvironmentInputP1!
    $securityInput: SecurityInputP1!
  ) {
    submitP1Data(
      editor: $editorInput
      solution: $solutionInput
      hosting: $hostingInput
      environment: $environmentInput
      security: $securityInput
    ) {
      id
      name
      # Champs critiques demandés après soumission : score global et niveau de risque (P1)
      latestScore {
        global_score
        risk_level
        notes 
      }
    }
  }
`;

// const CollectorStepper: React.FC = () => {
//   const [step, setStep] = useState(1);
//   const [formData, setFormData] = useState<any>({});
//   const [showP2Details, setShowP2Details] = useState(false); // Progressive Disclosure

//   // Fonction de soumission (qui utiliserait useMutation d'Apollo Client)
//   const handleSubmit = () => {
//     console.log('Soumission des données P1:', formData);
//     // Ici, on appellerait la mutation CREATE_SOLUTION_ENVIRONMENT_P1
//     alert('Données P1 soumises avec succès. Le Scoring Engine est notifié.');
//   };

const CollectorStepper: React.FC = () => {
    // État du formulaire...
    const [formData, setFormData] = useState<any>({
        // Initialisation des champs P1 (ex: Editor.name, Solution.type, Environment.backup.exists, etc.)
    });
    const [step, setStep] = useState(1);
    const [showP2Details, setShowP2Details] = useState(false); // Progressive Disclosure [9]

    // Chargement des lookups P1
    const { data: lookupsData, loading: lookupsLoading } = useQuery(GET_P1_LOOKUPS);

    // Extraction des valeurs actives des lookups
    const lookups = useMemo(() => {
        if (!lookupsData) return {};
        
        const extractValues = (lookupArray: any[]) => {
            if (!lookupArray || lookupArray.length === 0) return [];
            return lookupArray[0]?.values?.filter((v: any) => v.active !== false) || [];
        };

        return {
            businessCriticality: extractValues(lookupsData.businessCriticality || []),
            solutionTypes: extractValues(lookupsData.solutionTypes || []),
            dataTypes: extractValues(lookupsData.dataTypes || []),
            redundancyLevels: extractValues(lookupsData.redundancyLevels || []),
            authTypes: extractValues(lookupsData.authTypes || []),
        };
    }, [lookupsData]);

    // Hook Apollo pour la mutation
    const [submitP1Data, { loading, error, data }] = useMutation(CREATE_SOLUTION_ENVIRONMENT_P1);

    const handleSubmit = async () => {
        if (loading) return;

        // Préparation des inputs (cette étape serait la plus complexe en production
        // car elle doit mapper le state du formulaire aux structures d'Input GraphQL)
        const inputs = {
            editorInput: { name: formData.editorName, business_criticality: formData.editorCriticality }, // P1 [1]
            solutionInput: { name: formData.solutionName, type: formData.solutionType, product_criticality: formData.solutionCriticality }, // P1 [1]
            hostingInput: { provider: formData.provider, region: formData.region }, // P1 [3, 10]
            environmentInput: { data_types: formData.dataTypes, redundancy: formData.redundancy, backup: { exists: formData.backupExists, rto: formData.rto, rpo: formData.rpo } }, // P1 [2, 11]
            securityInput: { auth: formData.auth, encryption: { in_transit: formData.encryptTransit, at_rest: formData.encryptRest } }, // P1 [3, 10]
        };

        try {
            const result = await submitP1Data({ variables: inputs });
            
            if (result.data) {
                const snapshot = result.data.submitP1Data.latestScore;
                alert(`Soumission réussie. Score initial : ${snapshot.global_score}, Risque : ${snapshot.risk_level}`);
                // Passer à l'étape de visualisation des résultats (Dashboard scoring) [12]
                setStep(4); 
            }

        } catch (e) {
            console.error("Erreur de soumission GraphQL:", e);
            alert(`Échec de la soumission : ${error?.message}`);
        }
    };

    // Affichage du chargement si les lookups ne sont pas encore chargés
    if (lookupsLoading) {
        return (
            <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-500 text-sm">Chargement des listes de valeurs...</p>
            </div>
        );
    }

    const renderStep = () => {
    switch (step) {
      case 1:
        // --- Étape 1 : Identification Éditeur & Solution (P1) ---
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">1. Identification de la Solution (P1)</h2>

            {/* Editor.name (P1) */}
            <label className="block">Nom de l'Éditeur :
                <AssistanceTooltip content="Nom légal de l'entreprise éditrice du logiciel." />
            </label>
            <input type="text" className="w-full border p-2 rounded" required />

            {/* Editor.business_criticality (P1) */}
            <label className="block pt-2">Criticité Métier :
                <AssistanceTooltip content="Évalue l'impact métier si l'éditeur devenait indisponible (définitions standardisées). P1 pour le score global : fixe la tolérance au risque et les exigences de product_criticality." />
            </label>
            <select className="w-full border p-2 rounded">
              <option value="">Sélectionner...</option>
              {lookups.businessCriticality.map((item: any) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>

            {/* Solution.type (P1) */}
            <label className="block pt-2">Mode Logiciel (Type) :
                <AssistanceTooltip content="Modèle de livraison du logiciel. Crucial pour les enjeux d'hébergement." />
            </label>
            <select className="w-full border p-2 rounded">
              <option value="">Sélectionner...</option>
              {lookups.solutionTypes.map((item: any) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 2:
        // --- Étape 2 : Hébergement et Résilience (P1) ---
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">2. Hébergement & Résilience (P1)</h2>

            {/* Hosting.provider (P1) */}
            <label className="block">Fournisseur Cloud/Hébergeur :
                <AssistanceTooltip content="Nom du fournisseur technique (ex: OVH, Azure, GCP). Champ conditionnel si SaaS ou Hébergé." />
            </label>
            <input type="text" className="w-full border p-2 rounded" defaultValue="OVH" />

            {/* Hosting.region (P1) */}
            <label className="block pt-2">Région d'Hébergement :
                <AssistanceTooltip content="Pays/Région où les données sont hébergées. Nécessaire pour la conformité RGPD." />
            </label>
            <input type="text" className="w-full border p-2 rounded" defaultValue="France" />

            {/* Environment.data_types (P1) */}
            <label className="block pt-2">Types de Données Hébergées (P1) :
                <AssistanceTooltip content="Indique si des données réglementées sont traitées (Santé, Finance, RGPD). Critique pour le score de conformité (20%) et justifie les exigences de certifications (HDS, Ségur)." />
            </label>
            <select multiple className="w-full border p-2 rounded">
              {lookups.dataTypes.map((item: any) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>

            {/* Environment.backup (exists, RTO, RPO) (P1) */}
            <div className="border p-4 rounded mt-4">
              <label className="block font-medium">Politique de Sauvegarde (Backup) :</label>
              <div className="flex items-center pt-2">
                <input type="checkbox" id="backupExists" className="mr-2" />
                <label htmlFor="backupExists">Existe-t-elle ? (P1)</label>
              </div>

              <label className="block pt-2">RTO (Heures) :
                <AssistanceTooltip content="Recovery Time Objective : durée maximale pour rétablir le service après un incident critique. P1 pour le score Résilience (20%). Un RTO court est attendu pour un score élevé." />
              </label>
              <input type="number" min="0" className="w-full border p-2 rounded" placeholder="Ex: 24 (heures)" />

              <label className="block pt-2">RPO (Heures) :
                <AssistanceTooltip content="Recovery Point Objective: Perte de données maximale acceptable (en heures)." />
              </label>
              <input type="number" min="0" className="w-full border p-2 rounded" placeholder="Ex: 4 (heures)" />
            </div>

            {/* Progressive Disclosure pour P2/P3 */}
            <button
              onClick={() => setShowP2Details(!showP2Details)}
              className="mt-4 text-blue-500 hover:underline"
            >
              {showP2Details ? 'Masquer' : 'Voir plus de détails P2/P3 (Certifications, Tech Stack)'}
            </button>

            {showP2Details && (
              <div className="border p-4 rounded bg-gray-50 mt-2">
                <h3 className="font-semibold mb-2">Champs P2 : Architecture et Certifications</h3>
                {/* Exemple de champ P2/P3 : Hosting.certifications */}
                <label className="block">Certifications (P2) :</label>
                <select multiple className="w-full border p-2 rounded">
                    <option>ISO 27001</option><option>HDS</option><option>SOC 2</option>
                </select>
                {/* Exemple de champ P2 : Environment.deployment_type */}
                <label className="block pt-2">Type de déploiement (P2) :</label>
                <select className="w-full border p-2 rounded">
                    <option>monolith</option><option>microservices</option><option>hybrid</option>
                </select>
              </div>
            )}
          </div>
        );

      case 3:
        // --- Étape 3 : Sécurité Minimale (P1) ---
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">3. Sécurité Minimale (P1)</h2>

            {/* SecurityProfile.auth (P1) */}
            <label className="block">Authentification :
                <AssistanceTooltip content="Méthode pour valider l'identité des utilisateurs (Passwords/MFA/SSO). P1 pour le score Sécurité (30%) : MFA ou SSO requis pour atteindre le maximum." />
            </label>
            <select className="w-full border p-2 rounded">
              <option value="">Sélectionner...</option>
              {lookups.authTypes.map((item: any) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>

            {/* SecurityProfile.encryption (in_transit, at_rest) (P1) */}
            <div className="border p-4 rounded mt-4">
              <label className="block font-medium mb-2">Chiffrement des Données (P1) :</label>
              <div className="flex items-center">
                <input type="checkbox" id="encryptTransit" className="mr-2" />
                <label htmlFor="encryptTransit">Chiffrement en Transit (ex: HTTPS) ?</label>
              </div>
              <div className="flex items-center pt-2">
                <input type="checkbox" id="encryptRest" className="mr-2" />
                <label htmlFor="encryptRest">Chiffrement au Repos (base de données/disque) ?</label>
              </div>
            </div>
          </div>
        );

      case 4:
        // --- Étape 4 : Soumission et Résultat MVS ---
        return (
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-6">Prêt à soumettre les données P1</h2>
            <p className="mb-8">Confirmez la soumission pour déclencher le premier **Scoring Snapshot** de la solution.</p>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              Soumettre et Calculer le Score Initial (P1)
            </button>
          </div>
        );

      default:
        return <p>Étape inconnue.</p>;
    }
  };

    return (
      <div>
        {renderStep()}

        <div className="flex justify-between mt-8 pt-4 border-t">
          {step > 1 && step <= 3 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Précédent
            </button>
          )}

          {step < 4 && (
            <button
              onClick={() => setStep(step + 1)}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 ml-auto"
            >
              Suivant
            </button>
          )}
        </div>
      </div>
    );
};

export default CollectorStepper;