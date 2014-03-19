 avconv -i MattCutts_2011U.mp4 -c:v libvpx -b:v 1M -c:a libvorbis MattCutts_2011U.webm

/// Notes prototype version 2 :

- On peut charger une video à partir du web uniquement depuis Youtube
- Le chargement de fichiers video depuis l'ordinateur est limitée aux fichiers mp4 et webm
- Le chargement de media depuis le web ou la machine fonctionne si le fichier contient du son et de la vidéo
- La sélection des fichiers est toujours multiple, il faut désélectionné puis resélectionner
- La librairie permettant de fusionner la video et le son ne permet pas de produire un fichier qui peut être lu dans chrome
- La fonctionnalité de fusion du son et de l'image n'étant pas concluante elle n'est pas activée

/// TODO V3
- On doit pouvoir enregistrer, lire, charger des fichiers sonores uniquement (sans image)
- Améliorer / sécuriser la sélection des fichiers (vérification type URL, boutons radio vs checkbox, présence de fichier etc...)
- Vérifier les userMedia disponnibles (webcam ? micro ? aucun ?)
- Architecture