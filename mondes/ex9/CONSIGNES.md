# Exercice 9 — Projet final : la chasse au trésor

Comme pour les exercices 7 et 8, **aucune commande Git n’est fournie**.

## Le projet
Karel cherche un trésor sur un terrain qu’il ne connaît pas. Des **panneaux** (des piles de balises) lui indiquent où aller : il avance tout droit jusqu’au prochain panneau, le lit, lui obéit, et recommence jusqu’à trouver le trésor.

Un seul programme (`mondes/ex9/programme.karel`) grandit sur 5 étapes. Chaque étape ajoute un ou deux mondes (dans `mondes/ex9/mondes/`) et une règle du jeu.

**Règle d’or : à l’étape N, votre programme doit réussir tous les mondes des étapes 1 à N.**

## Les règles du jeu
### Dès l’étape 1
- Karel part avec un **sac vide**.
- Il avance tout droit et s’arrête sur la **première case qui contient au moins une balise** : c’est un panneau.
- Le nombre de balises du panneau est un ordre. **1 balise** : Karel tourne à gauche. **2 balises** : il tourne à droite. **4 balises** : c’est le **trésor**, Karel le ramasse en entier et s’arrête là.
- Après avoir obéi, Karel repart tout droit.
- **Karel lit sans abîmer** : quand il repart, le panneau doit être exactement comme avant. Le trésor est le seul à disparaître.

### À partir de l’étape 3
- **3 balises** : Karel fait demi-tour.

### À partir de l’étape 4
- Une pile de **5 à 9 balises** est un caillou, pas un panneau : Karel l’ignore et continue tout droit.

### À partir de l’étape 5
- Si un **mur** (ou le bord du terrain) lui barre la route avant d’avoir trouvé un panneau, Karel fait demi-tour.

## Les étapes
| Étape | Mondes | Ce qui est nouveau | Tag |
|---|---|---|---|
| 1 | `1a_virage_gauche`, `1b_virage_droite` | Lire un panneau et lui obéir. | `fin-1` |
| 2 | `2a_trois_virages`, `2b_six_virages` | Enchaîner un nombre quelconque de panneaux, et s’arrêter au trésor. | `fin-2` |
| 3 | `3a_demi_tour`, `3b_rebonds` | Le demi-tour. Un même panneau peut être lu plusieurs fois. | `fin-3` |
| 4 | `4a_cailloux`, `4b_champ_de_cailloux` | Les cailloux. | `fin-4` |
| 5 | `5a_murs`, `5b_grand_parcours` | Les murs. | `fin-5` |

Les tags `v1` à `v6` et `lab-1` à `lab-6` existent déjà : gardez ceux du tableau.

## À chaque étape
1. Chargez le nouveau monde et regardez pourquoi votre programme actuel échoue.
2. Faites évoluer le programme en **au moins 3 commits**.
3. Utilisez « Tester sur tous les mondes » : les mondes des étapes 1 à N doivent afficher ✅, les suivants ❌ (c’est normal).
4. Marquez la version terminée avec le tag de l’étape.
5. Envoyez votre travail sur GitHub, tags compris.

## Indices
- **Étape 1 :** Karel ne peut pas compter les balises d’une case : il peut seulement tester s’il y en a, et en ramasser une. Comment en déduire le nombre ? Et comment laisser le panneau comme avant ?
- **Étape 2 :** Karel ne retient rien : comment sait-il qu’il a trouvé le trésor ? Regardez le sac de Karel, affiché sous le monde. Autre piège : quand Karel repart d’un panneau, il est encore posé dessus.
- **Étape 3 :** ne cherchez pas à prévoir le trajet : suivez simplement les règles, même quand Karel repasse par un panneau déjà lu.
- **Étape 4 :** que fait votre lecture quand il y a plus de balises que prévu ?
- **Étape 5 :** à quel endroit de votre programme Karel avance-t-il ? C’est là qu’il faut vérifier qu’il peut le faire.

## Objectifs de fin de projet
1. L’historique, avec les 5 tags visibles, doit se lire comme l’histoire de votre projet.
2. Retrouvez, sans parcourir les commits un par un, le premier commit où le mot `demi_tour` apparaît dans votre programme.
3. Choisissez une ligne de votre programme final et retrouvez le commit qui l’a écrite, avec sa date.
4. Combien de lignes ont été ajoutées ou supprimées entre `fin-2` et `fin-5` ? Faites-le afficher par Git.
5. Remplacez le tag `fin-5` par un tag annoté dont le message résume votre méthode en une phrase, puis faites en sorte que GitHub le reflète.
