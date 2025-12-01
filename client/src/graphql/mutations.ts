// Fichier : /client/src/graphql/mutations.ts

import { gql } from '@apollo/client';

// NOTE : Cette mutation est une structure simplifiée pour l'MVS P1,
// elle combine la création ou la mise à jour des entités Editor, Solution, Hosting, et Environment.

export const CREATE_SOLUTION_ENVIRONMENT_P1 = gql`
  mutation CreateSolutionEnvironmentP1(
    $editorInput: EditorInputP1!
    $solutionInput: SolutionInputP1!
    $hostingInput: HostingInputP1!
    $environmentInput: EnvironmentInputP1!
    $securityInput: SecurityInputP1!
  ) {
    # La logique de mutation sera implémentée dans le Backend Resolver (ex: SolutionResolver)
    # Elle prend les inputs P1 et retourne le ScoringSnapshot créé.
    submitP1Data(
      editor: $editorInput
      solution: $solutionInput
      hosting: $hostingInput
      environment: $environmentInput
      security: $securityInput
    ) {
      # Nous demandons en retour les champs P1 critiques de la solution mise à jour
      id
      name
      # Et surtout le premier Scoring Snapshot généré (P1)
      latestScore {
        global_score
        risk_level
        notes
      }
    }
  }
`;

// Note : Les interfaces TypeScript (EditorInputP1, etc.) sont définies dans /common/types.
// Le backend doit utiliser les types partagés pour définir ces Inputs.