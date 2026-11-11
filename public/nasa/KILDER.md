# Bilder fra NASA

Overflatebildene i denne mappen kommer fra NASA sin åpne samling
[NASA 3D Resources](https://github.com/nasa/NASA-3D-Resources) (mappen «Images and Textures»).
Ifølge NASA er de fri til bruk og uten opphavsrett. Se også NASA sine
[retningslinjer for bruk av bilder](https://www.nasa.gov/nasa-brand-center/images-and-media):
ikke bruk NASA-logoen, og ikke gi inntrykk av at NASA står bak appen.

Bildene er komprimert på nytt (JPEG, kvalitet 85) og har fått norske filnavn:

| Fil             | Original i samlingen   |
| --------------- | ---------------------- |
| `jorden.jpg`    | Earth (A)              |
| `mars.jpg`      | Mars                   |
| `venus.jpg`     | Venus (radarkart av bakken under skyene) |
| `jupiter.jpg`   | Jupiter                |
| `saturn.jpg`    | Saturn                 |
| `neptun.jpg`    | Neptune                |
| `io.jpg`        | Jupiter - Io (B)       |
| `europa.jpg`    | Jupiter - Europa       |
| `ganymedes.jpg` | Jupiter - Ganymede     |

## Romstasjonen (ISS)

`iss.glb` er modellen «International Space Station (ISS) (A)» fra samme samling
(mappen «3D Models»). Den var komprimert med Draco; den er pakket ut med
[glTF-Transform](https://gltf-transform.dev/) så nettleseren kan lese den uten ekstra dekoder.

Hvor ISS er, regnes ut i `iss.js` med [satellite.js](https://github.com/shashwatak/satellite-js)
fra ferske banedata som hentes når appen starter – fra
[CelesTrak](https://celestrak.org/) (eller [wheretheiss.at](https://wheretheiss.at/) hvis
CelesTrak ikke svarer). Ingenting om brukeren sendes med.
