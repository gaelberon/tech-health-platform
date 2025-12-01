// Fichier : /server/src/graphql/resolvers/index.ts

// ------------------ IMPORTS DES RESOLVERS ------------------
// Note: Utilisation de l'extension .js car le compilateur TS cherche les fichiers de sortie JS lors de l'import ESM.

// P1 - Noyau
import EditorResolver from './EditorResolver.js';
import SolutionResolver from './SolutionResolver.js'; 
import EnvironmentResolver from './EnvironmentResolver.js'; 
import HostingResolver from './HostingResolver.js'; 
import SecurityProfileResolver from './SecurityProfileResolver.js'; 
import ScoringSnapshotResolver from './ScoringSnapshotResolver.js'; 

// P2 - Architecture & Opérations
import CodeBaseResolver from './CodeBaseResolver.js';
import MonitoringObservabilityResolver from './MonitoringObservabilityResolver.js';

// P3 - Métriques & Roadmap
import DevelopmentMetricsResolver from './DevelopmentMetricsResolver.js'; // Souvent intégré à Solution/Editor Resolver, mais on l'importe ici si séparé
import PerformanceMetricsResolver from './PerformanceMetricsResolver.js';
import RoadmapItemResolver from './RoadmapItemResolver.js';
import AIFeaturesResolver from './AIFeaturesResolver.js';

// P4 - Coûts & Docs
import EntityCostResolver from './EntityCostResolver.js';
import DocumentResolver from './DocumentResolver.js';
import DevelopmentTeamResolver from './DevelopmentTeamResolver.js';
import { AuthResolver } from './AuthResolver.js';
import PermissionResolver from './PermissionResolver.js';
import LookupResolver from './LookupResolver.js';
import UserResolver from './UserResolver.js';


// ------------------ FONCTION D'AGREGATION ------------------

/**
 * Fonction utilitaire pour fusionner les resolvers, car Apollo Server attend
 * un seul objet de resolvers.
 * 
 * @param resolversArray Tableau de tous les objets de resolvers (Query, Mutation, TypeResolvers)
 */
function combineResolvers(resolversArray: any[]): any {
    const combined = {
        Query: {},
        Mutation: {},
        // Ajoutez ici tous les types nécessitant des Field Resolvers
        Editor: {},
        Solution: {},
        Environment: {},
        ...resolversArray
            .filter(r => r.Query || r.Mutation || r.Solution || r.Environment || r.Editor) // Filtre pour les resolvers valides
            .reduce((acc, resolver) => {
                // Fusion des Query et Mutation
                Object.assign(acc.Query, resolver.Query);
                Object.assign(acc.Mutation, resolver.Mutation);

                // Fusion des Field Resolvers (Editor, Solution, Environment, etc.)
                if (resolver.Editor) Object.assign(acc.Editor, resolver.Editor);
                if (resolver.Solution) Object.assign(acc.Solution, resolver.Solution);
                if (resolver.Environment) Object.assign(acc.Environment, resolver.Environment);
                // Ajoutez ici la gestion des autres Type Resolvers si nécessaire (ex: Hosting, SecurityProfile)
                
                return acc;
            }, { Query: {}, Mutation: {}, Editor: {}, Solution: {}, Environment: {} }),
    };
    
    // Pour ne pas inclure des objets vides si aucune Query/Mutation n'a été trouvée
    if (Object.keys(combined.Query).length === 0) delete combined.Query;
    if (Object.keys(combined.Mutation).length === 0) delete combined.Mutation;

    return combined;
}


// ------------------ EXPORT DE L'OBJET GLOBAL ------------------

const allResolvers = combineResolvers([
    EditorResolver,
    SolutionResolver,
    EnvironmentResolver,
    HostingResolver,
    SecurityProfileResolver,
    ScoringSnapshotResolver,
    CodeBaseResolver,
    MonitoringObservabilityResolver,
    DevelopmentMetricsResolver,
    PerformanceMetricsResolver,
    RoadmapItemResolver,
    AIFeaturesResolver,
    EntityCostResolver,
    DocumentResolver,
    DevelopmentTeamResolver,
    AuthResolver,
    PermissionResolver,
    LookupResolver,
    UserResolver,
]);

export default allResolvers;