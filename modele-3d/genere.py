#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Génère la plaque imprimable « Morse Training ».

La géométrie n'est pas dessinée à la main : elle est dérivée du fichier
`public/icons/icon.svg`, qui définit l'icône du site dans une zone de 64 × 64 :

    <rect width="64" height="64" rx="14" fill="#0b1015"/>
    <circle cx="16" cy="32" r="5.5" fill="#ffb545"/>
    <rect x="27" y="26.5" width="22" height="11" rx="5.5" fill="#ffb545"/>

soit un carré aux coins arrondis portant la lettre A du morse : un point et un
trait. Les proportions du SVG sont conservées à l'identique, seule l'échelle
change. Modifier l'icône du site et relancer ce script suffit donc à mettre le
modèle à jour.

La plaque est pleine : à charge de qui l'imprime d'y ajouter, dans le
trancheur, la cavité qu'il veut — un volume négatif suffit. Elle sort en deux
pièces, le corps et le motif, de sorte que le logo puisse recevoir sa propre
couleur.

Le script n'a aucune dépendance : bibliothèque standard uniquement. Il écrit
un `.3mf` (le format que préfère Bambu Studio), deux `.stl` et un aperçu PNG.

    python3 modele-3d/genere.py

Toutes les cotes sont en millimètres.
"""

from __future__ import annotations

import math
import os
import struct
import zlib
import zipfile

# ─────────────────────────────────────────────────────────────────────────────
# Paramètres — c'est ici, et nulle part ailleurs, qu'on règle le modèle.
# ─────────────────────────────────────────────────────────────────────────────

COTE = 35.0                 # côté de la plaque
EPAISSEUR = 5.0             # épaisseur totale
RAYON_COIN = COTE * 14 / 64  # rayon des coins, repris tel quel du SVG (rx=14/64)

CHANFREIN_HAUT = 0.5        # arête supérieure cassée à 45°, pour la main
CHANFREIN_BAS = 0.4         # arête inférieure cassée : masque le pied d'éléphant

# Le motif est creusé dans la face du dessus ; l'incrustation vient le remplir.
PROFONDEUR_MOTIF = 1.0      # 5 couches à 0,2 mm
JEU_MOTIF = 0.0             # 0 = bicolore (AMS ou changement de filament).
                            # 0.15 = incrustation imprimée à part puis collée.
CENTRER_MOTIF = True        # l'icône penche de 2,25/64 à gauche : imperceptible
                            # à 64 px, visible sur 35 mm. True la recentre.

# Finesse des contours. Erreur de corde < 0,01 mm partout.
SEG_COIN = 32               # segments par quart de rond de la plaque
SEG_POINT = 64              # segments pour le point (le disque du motif)
SEG_TRAIT = 32              # segments par demi-cercle du trait

# Couleurs de l'icône, reprises du SVG : elles ne servent qu'à l'aperçu et à
# l'affichage du .3mf dans le trancheur.
COULEUR_CORPS = '#0B1015'
COULEUR_MOTIF = '#FFB545'

EPS = 1e-9

# ─── Cotes dérivées ──────────────────────────────────────────────────────────

DEMI = COTE / 2
Z_MOTIF = EPAISSEUR - PROFONDEUR_MOTIF

ECHELLE = COTE / 64          # du repère SVG au millimètre


# ─────────────────────────────────────────────────────────────────────────────
# Contours 2D. Convention : le plan XY est vu du dessus, le sens direct (CCW)
# borde la matière, le sens horaire (CW) borde un vide.
# ─────────────────────────────────────────────────────────────────────────────

def arc(cx, cy, r, a0, a1, n):
    """n+1 points de a0 à a1 (radians), bornes comprises."""
    return [(cx + r * math.cos(a0 + (a1 - a0) * k / n),
             cy + r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(n + 1)]


def cercle(cx, cy, r, n):
    return [(cx + r * math.cos(2 * math.pi * k / n),
             cy + r * math.sin(2 * math.pi * k / n)) for k in range(n)]


def carre_arrondi(demi, rayon, n=SEG_COIN, cx=0.0, cy=0.0):
    """Carré aux coins arrondis, centré. Les quatre arcs sont reliés par les
    côtés droits : deux carrés de rayons différents mais de mêmes centres de
    coins ont des sommets qui se correspondent un à un, ce qui rend le
    chanfrein exact."""
    d = demi - rayon
    pts = []
    for a0, a1, sx, sy in ((-90, 0, +1, -1), (0, 90, +1, +1),
                           (90, 180, -1, +1), (180, 270, -1, -1)):
        pts += arc(cx + sx * d, cy + sy * d, rayon,
                   math.radians(a0), math.radians(a1), n)
    return pts


def stade(x0, y0, x1, y1, n=SEG_TRAIT):
    """Rectangle à bouts parfaitement ronds (rx = hauteur/2), comme le trait."""
    r = (y1 - y0) / 2
    ym = (y0 + y1) / 2
    pts = arc(x1 - r, ym, r, math.radians(-90), math.radians(90), n)
    pts += arc(x0 + r, ym, r, math.radians(90), math.radians(270), n)
    return pts


def aire(poly):
    s = 0.0
    for k in range(len(poly)):
        x0, y0 = poly[k]
        x1, y1 = poly[(k + 1) % len(poly)]
        s += x0 * y1 - x1 * y0
    return s / 2


def sens(poly, direct):
    """Force l'orientation : direct=True → CCW (matière), False → CW (vide)."""
    return list(poly) if (aire(poly) > 0) == direct else list(reversed(poly))


def dilate(poly, d):
    """Décale un contour de d vers l'extérieur, à partir de son centre.
    Utilisé seulement sur des contours convexes centrés (les cercles)."""
    out = []
    for x, y in poly:
        n = math.hypot(x, y) or 1.0
        out.append((x + d * x / n, y + d * y / n))
    return out


# ─── Le motif, transposé du SVG ──────────────────────────────────────────────

# Boîte du motif dans le SVG : de x=10.5 (bord gauche du point) à x=49 (bord
# droit du trait). Son centre tombe à 29.75 au lieu de 32.
_BOITE = (16 - 5.5, 27 + 22)
DECALAGE = (32 - (_BOITE[0] + _BOITE[1]) / 2) * ECHELLE if CENTRER_MOTIF else 0.0


def svg_x(v):
    return (v - 32) * ECHELLE + DECALAGE


def svg_y(v):
    return (32 - v) * ECHELLE      # l'axe Y du SVG descend, celui du modèle monte


def contours_motif(jeu=0.0):
    """Le point et le trait. `jeu` rétrécit l'incrustation par rapport au creux."""
    point = cercle(svg_x(16), svg_y(32), 5.5 * ECHELLE - jeu, SEG_POINT)
    x0, x1 = svg_x(27), svg_x(27 + 22)
    y0, y1 = svg_y(26.5 + 11), svg_y(26.5)
    trait = stade(x0 + jeu, y0 + jeu, x1 - jeu, y1 - jeu)
    return point, trait


# ─────────────────────────────────────────────────────────────────────────────
# Triangulation d'un contour avec trous : ponts + découpe d'oreilles.
# Les sommets produits sont exactement ceux des contours, sans point ajouté :
# les faces horizontales se soudent donc aux parois sans jointure.
# ─────────────────────────────────────────────────────────────────────────────

def _dans_triangle(a, b, c, p):
    d1 = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
    d2 = (c[0] - b[0]) * (p[1] - b[1]) - (c[1] - b[1]) * (p[0] - b[0])
    d3 = (a[0] - c[0]) * (p[1] - c[1]) - (a[1] - c[1]) * (p[0] - c[0])
    return d1 >= -EPS and d2 >= -EPS and d3 >= -EPS


def _confondus(p, q):
    return abs(p[0] - q[0]) < 1e-7 and abs(p[1] - q[1]) < 1e-7


def _pont(exterieur, trou):
    """Relie un trou au contour extérieur par une fente de largeur nulle.
    Méthode d'Eberly : on part du sommet le plus à droite du trou, on tire un
    rayon vers +X et on cherche le sommet du contour par lequel passer."""
    j = max(range(len(trou)), key=lambda k: trou[k][0])
    m = trou[j]

    meilleur_t, arete = None, None
    for k in range(len(exterieur)):
        a, b = exterieur[k], exterieur[(k + 1) % len(exterieur)]
        if (a[1] > m[1]) == (b[1] > m[1]):
            continue
        t = a[0] + (m[1] - a[1]) * (b[0] - a[0]) / (b[1] - a[1])
        if t < m[0] - EPS:
            continue
        if meilleur_t is None or t < meilleur_t:
            meilleur_t, arete = t, (k, (k + 1) % len(exterieur))
    if arete is None:
        raise ValueError('aucun pont trouvé pour ce trou')

    inter = (meilleur_t, m[1])
    # On vise le sommet de l'arête le plus à droite, puis on lui préfère tout
    # sommet réflexe qui se glisserait dans le triangle (m, inter, sommet).
    i = arete[0] if exterieur[arete[0]][0] > exterieur[arete[1]][0] else arete[1]
    p = exterieur[i]
    tri = (m, inter, p) if p[1] > m[1] else (m, p, inter)
    meilleur_cos = -2.0
    for k, s in enumerate(exterieur):
        if _confondus(s, p):
            continue
        prec = exterieur[(k - 1) % len(exterieur)]
        suiv = exterieur[(k + 1) % len(exterieur)]
        reflexe = ((s[0] - prec[0]) * (suiv[1] - s[1])
                   - (s[1] - prec[1]) * (suiv[0] - s[0])) <= 0
        if not reflexe or not _dans_triangle(tri[0], tri[1], tri[2], s):
            continue
        d = math.hypot(s[0] - m[0], s[1] - m[1]) or 1.0
        c = (s[0] - m[0]) / d
        if c > meilleur_cos:
            meilleur_cos, i = c, k
    return exterieur[:i + 1] + trou[j:] + trou[:j + 1] + exterieur[i:]


def triangule(exterieur, trous=()):
    """Contour extérieur CCW, trous CW → triangles CCW vus du dessus."""
    poly = sens(exterieur, True)
    for trou in sorted((sens(t, False) for t in trous),
                       key=lambda t: -max(p[0] for p in t)):
        poly = _pont(poly, trou)

    reste = list(range(len(poly)))
    tris = []
    garde = 4 * len(poly) * len(poly) + 64
    while len(reste) > 3 and garde > 0:
        garde -= 1
        n = len(reste)
        coupe = None
        secours = None
        for k in range(n):
            ia, ib, ic = reste[(k - 1) % n], reste[k], reste[(k + 1) % n]
            a, b, c = poly[ia], poly[ib], poly[ic]
            aire2 = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
            if aire2 <= EPS:
                continue
            libre = True
            for ip in reste:
                p = poly[ip]
                if _confondus(p, a) or _confondus(p, b) or _confondus(p, c):
                    continue
                if _dans_triangle(a, b, c, p):
                    libre = False
                    break
            if libre:
                coupe = (k, ia, ib, ic)
                break
            if secours is None or aire2 > secours[0]:
                secours = (aire2, k, ia, ib, ic)
        if coupe is None:
            if secours is None:
                break
            coupe = secours[1:]          # dernier recours : on coupe quand même
        k, ia, ib, ic = coupe
        tris.append((poly[ia], poly[ib], poly[ic]))
        reste.pop(k)
    if len(reste) == 3:
        tris.append(tuple(poly[i] for i in reste))
    return tris


# ─────────────────────────────────────────────────────────────────────────────
# Solide : un empilement de contours reliés par des parois, plus des faces
# horizontales déclarées explicitement. Aucune opération booléenne, donc aucune
# surprise : ce qui est écrit ici est exactement ce qui sort.
# ─────────────────────────────────────────────────────────────────────────────

class Solide:
    def __init__(self, nom):
        self.nom = nom
        self.tris = []

    def face(self, z, exterieur, trous=(), vers_le_haut=True):
        for t in triangule(exterieur, trous):
            a, b, c = ((x, y, z) for x, y in t)
            self.tris.append((a, b, c) if vers_le_haut else (a, c, b))

    def paroi(self, profils, matiere_dedans):
        """profils : [(z, contour)] du bas vers le haut, mêmes sommets.
        matiere_dedans=True pour le contour extérieur d'un solide, False pour
        la paroi d'une cavité. La normale sort toujours de la matière."""
        profils = [(z, sens(p, matiere_dedans)) for z, p in profils]
        for (z0, p0), (z1, p1) in zip(profils, profils[1:]):
            n = len(p0)
            assert n == len(p1), 'profils de tailles différentes'
            for k in range(n):
                a = (p0[k][0], p0[k][1], z0)
                b = (p0[(k + 1) % n][0], p0[(k + 1) % n][1], z0)
                c = (p1[(k + 1) % n][0], p1[(k + 1) % n][1], z1)
                d = (p1[k][0], p1[k][1], z1)
                self.tris.append((a, b, c))
                self.tris.append((a, c, d))

    def prisme(self, contour, z0, z1):
        """Volume plein droit : parois + les deux faces."""
        self.paroi([(z0, contour), (z1, contour)], True)
        self.face(z0, contour, vers_le_haut=False)
        self.face(z1, contour, vers_le_haut=True)

    # ─── Contrôle : un maillage utilisable doit être fermé et cohérent ───────
    def verifie(self):
        index, sommets = {}, []
        for tri in self.tris:
            for p in tri:
                cle = (round(p[0], 6), round(p[1], 6), round(p[2], 6))
                if cle not in index:
                    index[cle] = len(sommets)
                    sommets.append(cle)
        aretes = {}
        degenere = 0
        for a, b, c in self.tris:
            ia, ib, ic = (index[(round(p[0], 6), round(p[1], 6), round(p[2], 6))]
                          for p in (a, b, c))
            if ia == ib or ib == ic or ic == ia:
                degenere += 1
                continue
            for e in ((ia, ib), (ib, ic), (ic, ia)):
                aretes[e] = aretes.get(e, 0) + 1
        orphelines = sum(1 for e, n in aretes.items()
                         if n != 1 or aretes.get((e[1], e[0]), 0) != 1)
        volume = 0.0
        for a, b, c in self.tris:
            volume += (a[0] * (b[1] * c[2] - b[2] * c[1])
                       - a[1] * (b[0] * c[2] - b[2] * c[0])
                       + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6
        return {
            'nom': self.nom, 'triangles': len(self.tris), 'sommets': len(sommets),
            'degeneres': degenere, 'aretes_orphelines': orphelines,
            'volume_cm3': volume / 1000,
        }


# ─────────────────────────────────────────────────────────────────────────────
# Les deux pièces
# ─────────────────────────────────────────────────────────────────────────────

def construit_corps():
    """La plaque, pleine, creusée du seul motif."""
    s = Solide('Corps')
    plein = carre_arrondi(DEMI, RAYON_COIN)
    bas = carre_arrondi(DEMI - CHANFREIN_BAS, RAYON_COIN - CHANFREIN_BAS)
    haut = carre_arrondi(DEMI - CHANFREIN_HAUT, RAYON_COIN - CHANFREIN_HAUT)
    point, trait = contours_motif()

    # Flancs, avec les deux arêtes cassées à 45°.
    s.paroi([(0.0, bas), (CHANFREIN_BAS, plein),
             (EPAISSEUR - CHANFREIN_HAUT, plein), (EPAISSEUR, haut)], True)

    # Creux du motif, débouchant sur la face du dessus.
    s.paroi([(Z_MOTIF, point), (EPAISSEUR, point)], False)
    s.paroi([(Z_MOTIF, trait), (EPAISSEUR, trait)], False)

    # Faces horizontales.
    s.face(0.0, bas, vers_le_haut=False)                        # dessous, plein
    s.face(Z_MOTIF, point, vers_le_haut=True)                   # fond du creux
    s.face(Z_MOTIF, trait, vers_le_haut=True)
    s.face(EPAISSEUR, haut, [point, trait], vers_le_haut=True)  # dessus
    return s


def construit_motif():
    """Le point et le trait, pièce séparée pour recevoir leur propre couleur."""
    s = Solide('Motif')
    point, trait = contours_motif(JEU_MOTIF)
    s.prisme(point, Z_MOTIF, EPAISSEUR)
    s.prisme(trait, Z_MOTIF, EPAISSEUR)
    return s


# ─────────────────────────────────────────────────────────────────────────────
# Écriture des fichiers
# ─────────────────────────────────────────────────────────────────────────────

def maillage(solide):
    """Triangles bruts → sommets uniques + indices."""
    index, sommets, faces = {}, [], []
    for tri in solide.tris:
        ids = []
        for p in tri:
            cle = (round(p[0], 6), round(p[1], 6), round(p[2], 6))
            if cle not in index:
                index[cle] = len(sommets)
                sommets.append(cle)
            ids.append(index[cle])
        if len(set(ids)) == 3:
            faces.append(tuple(ids))
    return sommets, faces


def normale(a, b, c):
    u = (b[0] - a[0], b[1] - a[1], b[2] - a[2])
    v = (c[0] - a[0], c[1] - a[1], c[2] - a[2])
    n = (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2],
         u[0] * v[1] - u[1] * v[0])
    d = math.sqrt(sum(k * k for k in n)) or 1.0
    return (n[0] / d, n[1] / d, n[2] / d)


def ecrit_stl(solide, chemin):
    with open(chemin, 'wb') as f:
        f.write(('Morse Training — ' + solide.nom).encode('utf-8')[:80].ljust(80, b'\0'))
        f.write(struct.pack('<I', len(solide.tris)))
        for a, b, c in solide.tris:
            f.write(struct.pack('<3f', *normale(a, b, c)))
            for p in (a, b, c):
                f.write(struct.pack('<3f', *p))
            f.write(b'\0\0')


def _xml_maillage(solide):
    sommets, faces = maillage(solide)
    v = ''.join('<vertex x="%s" y="%s" z="%s"/>'
                % tuple(('%.4f' % k).rstrip('0').rstrip('.') or '0' for k in s)
                for s in sommets)
    t = ''.join('<triangle v1="%d" v2="%d" v3="%d"/>' % f for f in faces)
    return '<mesh><vertices>%s</vertices><triangles>%s</triangles></mesh>' % (v, t)


def ecrit_3mf(chemin, corps, motif, pose=(90.0, 90.0)):
    """3MF conforme au cœur de la norme : aucune extension propriétaire, donc
    lisible par Bambu Studio, Orca, PrusaSlicer ou Cura sans réparation.

    Le corps et le motif sont deux maillages distincts réunis en un seul objet
    par des composants. Les trancheurs dérivés de PrusaSlicer — Bambu Studio et
    Orca en font partie — les présentent alors comme deux pièces d'un même
    objet : c'est ce qui permet de donner sa couleur au logo, et d'ajouter un
    volume négatif à l'objet sans que les deux pièces se désolidarisent.
    """
    def tr(x, y, z=0.0):
        return '1 0 0 0 1 0 0 0 1 %g %g %g' % (x, y, z)

    modele = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<model unit="millimeter" xml:lang="fr-FR"'
        ' xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n'
        '<metadata name="Title">Plaque Morse Training</metadata>\n'
        '<metadata name="Designer">Morse Training</metadata>\n'
        '<metadata name="Description">Plaque pleine %g x %g x %g mm, logo en'
        ' pièce séparée</metadata>\n'
        '<resources>\n'
        '<basematerials id="1">'
        '<base name="Corps" displaycolor="%sFF"/>'
        '<base name="Motif" displaycolor="%sFF"/>'
        '</basematerials>\n'
        '<object id="2" name="Corps" type="model" pid="1" pindex="0">%s</object>\n'
        '<object id="3" name="Motif" type="model" pid="1" pindex="1">%s</object>\n'
        '<object id="4" name="Plaque Morse" type="model"><components>'
        '<component objectid="2"/><component objectid="3"/>'
        '</components></object>\n'
        '</resources>\n'
        '<build>\n'
        '<item objectid="4" transform="%s"/>\n'
        '</build>\n'
        '</model>\n'
    ) % (COTE, COTE, EPAISSEUR, COULEUR_CORPS, COULEUR_MOTIF,
         _xml_maillage(corps), _xml_maillage(motif), tr(pose[0], pose[1]))

    types = ('<?xml version="1.0" encoding="UTF-8"?>\n'
             '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
             '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
             '<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>'
             '</Types>\n')
    rels = ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rel0" Target="/3D/3dmodel.model"'
            ' Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>'
            '</Relationships>\n')

    with zipfile.ZipFile(chemin, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', types)
        z.writestr('_rels/.rels', rels)
        z.writestr('3D/3dmodel.model', modele)


# ─────────────────────────────────────────────────────────────────────────────
# Aperçu PNG : rendu plat avec tampon de profondeur, sans dépendance. Il ne
# sert qu'à vérifier d'un coup d'œil ce qui a été produit ; les matières sont
# éclaircies pour rester lisibles à l'écran.
# ─────────────────────────────────────────────────────────────────────────────

def _png(chemin, largeur, hauteur, pixels):
    lignes = b''.join(b'\x00' + bytes(pixels[y * largeur * 3:(y + 1) * largeur * 3])
                      for y in range(hauteur))

    def bloc(typ, data):
        c = typ + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c))

    with open(chemin, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(bloc(b'IHDR', struct.pack('>IIBBBBB', largeur, hauteur, 8, 2, 0, 0, 0)))
        f.write(bloc(b'IDAT', zlib.compress(lignes, 9)))
        f.write(bloc(b'IEND', b''))


# Éclairage à trois points. Les sources tournent avec l'azimut de la caméra —
# le modelé reste le même d'une vue à l'autre — mais basculent avec elle quand
# on passe sous la pièce, sinon la face du dessous resterait dans le noir.
_RIG = ((52, 46, 0.78), (-64, 12, 0.28), (168, 34, 0.24))


def _rig_monde(az, el):
    haut_bas = 1.0 if el >= 0 else -1.0
    rig = []
    for decalage, elevation, force in _RIG:
        a, e = math.radians(az + decalage), math.radians(elevation)
        rig.append(((math.cos(e) * math.cos(a), math.cos(e) * math.sin(a),
                     haut_bas * math.sin(e)), force))
    return rig


def _teinte(base, n, rig, vue):
    lum = 0.13
    for d, force in rig:
        cos = n[0] * d[0] + n[1] * d[1] + n[2] * d[2]
        if cos > 0:
            lum += force * cos
    d = rig[0][0]
    h = [d[k] - vue[k] for k in range(3)]
    hn = math.sqrt(sum(k * k for k in h)) or 1.0
    cos = sum(n[k] * h[k] / hn for k in range(3))
    spec = 0.24 * cos ** 16 if cos > 0 else 0.0
    return tuple(min(255, max(0, int(c * lum + 255 * spec))) for c in base)


def apercu(chemin, panneaux, largeur=1160, hauteur=560, sur=2):
    L, H = largeur * sur, hauteur * sur
    fond = (233, 236, 240)
    pix = bytearray(fond[i % 3] for i in range(L * H * 3))
    prof = [1e18] * (L * H)

    for panneau, (az, el, pieces, cadre) in enumerate(panneaux):
        a, e = math.radians(az), math.radians(el)
        avant = (-math.cos(e) * math.cos(a), -math.cos(e) * math.sin(a), -math.sin(e))
        droite = (-math.sin(a), math.cos(a), 0.0)
        haut = (droite[1] * avant[2] - droite[2] * avant[1],
                droite[2] * avant[0] - droite[0] * avant[2],
                droite[0] * avant[1] - droite[1] * avant[0])
        rig = _rig_monde(az, el)
        cx = (panneau + 0.5) * L / len(panneaux)
        cy = H * 0.53
        k = cadre * sur

        tris = []
        for solide, base, decalage in pieces:
            for t in solide.tris:
                t = tuple((p[0] + decalage[0], p[1] + decalage[1],
                           p[2] + decalage[2] - EPAISSEUR / 2) for p in t)
                n = normale(*t)
                if sum(n[i] * avant[i] for i in range(3)) > -0.02:
                    continue                       # face détournée : inutile
                ecran = [(cx + k * sum(p[i] * droite[i] for i in range(3)),
                          cy - k * sum(p[i] * haut[i] for i in range(3)),
                          sum(p[i] * avant[i] for i in range(3))) for p in t]
                tris.append((ecran, _teinte(base, n, rig, avant)))

        for ecran, coul in tris:
            ys = [p[1] for p in ecran]
            y0, y1 = max(0, int(min(ys))), min(H - 1, int(max(ys)) + 1)
            (ax, ay, az_), (bx, by, bz), (cxx, cyy, cz) = ecran
            det = (by - cyy) * (ax - cxx) + (cxx - bx) * (ay - cyy)
            if abs(det) < 1e-9:
                continue
            for y in range(y0, y1 + 1):
                xs = []
                for (px, py, _), (qx, qy, _) in ((ecran[0], ecran[1]),
                                                 (ecran[1], ecran[2]),
                                                 (ecran[2], ecran[0])):
                    if (py > y + 0.5) == (qy > y + 0.5):
                        continue
                    xs.append(px + (y + 0.5 - py) * (qx - px) / (qy - py))
                if len(xs) < 2:
                    continue
                xa, xb = min(xs), max(xs)
                for x in range(max(0, int(xa)), min(L - 1, int(xb) + 1) + 1):
                    w0 = ((by - cyy) * (x + 0.5 - cxx) + (cxx - bx) * (y + 0.5 - cyy)) / det
                    w1 = ((cyy - ay) * (x + 0.5 - cxx) + (ax - cxx) * (y + 0.5 - cyy)) / det
                    z = w0 * az_ + w1 * bz + (1 - w0 - w1) * cz
                    i = y * L + x
                    if z < prof[i]:
                        prof[i] = z
                        pix[i * 3:i * 3 + 3] = bytes(coul)

    # Un fond de poche et la face qui l'entoure ont la même normale, donc la
    # même teinte : sans trait, la cavité serait invisible. On souligne donc
    # les ruptures de profondeur, silhouette comprise.
    for y in range(H - 1):
        for x in range(L - 1):
            i = y * L + x
            z = prof[i]
            for j in (i + 1, i + L):
                if abs(z - prof[j]) > 0.30:
                    k = i if z > prof[j] else j
                    if prof[k] < 1e17:
                        pix[k * 3] = pix[k * 3] * 6 // 10
                        pix[k * 3 + 1] = pix[k * 3 + 1] * 6 // 10
                        pix[k * 3 + 2] = pix[k * 3 + 2] * 6 // 10

    # Sous-échantillonnage : c'est tout l'anticrénelage dont on a besoin.
    sortie = bytearray(largeur * hauteur * 3)
    n = sur * sur
    for y in range(hauteur):
        for x in range(largeur):
            r = v = b = 0
            for dy in range(sur):
                base = ((y * sur + dy) * L + x * sur) * 3
                for dx in range(sur):
                    r += pix[base + dx * 3]
                    v += pix[base + dx * 3 + 1]
                    b += pix[base + dx * 3 + 2]
            i = (y * largeur + x) * 3
            sortie[i], sortie[i + 1], sortie[i + 2] = r // n, v // n, b // n
    _png(chemin, largeur, hauteur, sortie)


# ─────────────────────────────────────────────────────────────────────────────

def rgb(hexa):
    return tuple(int(hexa[i:i + 2], 16) for i in (1, 3, 5))


def main():
    ici = os.path.dirname(os.path.abspath(__file__))
    stl = os.path.join(ici, 'stl')
    os.makedirs(stl, exist_ok=True)

    corps, motif = construit_corps(), construit_motif()

    faux = 0
    for s in (corps, motif):
        r = s.verifie()
        etat = 'fermé' if r['aretes_orphelines'] == 0 and r['degeneres'] == 0 else 'DÉFAUT'
        print('%-8s %6d triangles  %5d sommets  %7.2f cm³  %s'
              % (r['nom'], r['triangles'], r['sommets'], r['volume_cm3'], etat))
        if etat != 'fermé' or r['volume_cm3'] <= 0:
            faux += 1
            print('   arêtes orphelines : %d, triangles dégénérés : %d'
                  % (r['aretes_orphelines'], r['degeneres']))
    if faux:
        raise SystemExit('maillage inutilisable, rien n’a été écrit')

    ecrit_3mf(os.path.join(ici, 'plaque-morse.3mf'), corps, motif)
    for s, nom in ((corps, 'corps'), (motif, 'motif')):
        ecrit_stl(s, os.path.join(stl, 'plaque-morse-%s.stl' % nom))

    # Le gris du rendu est bien plus clair que le #0b1015 de l'icône : sous
    # cette lumière, un tirage noir mat ne montrerait aucun relief. À droite,
    # le motif est soulevé : c'est la pièce à qui l'on donne sa couleur.
    sombre, clair = rgb('#68727e'), rgb(COULEUR_MOTIF)
    apercu(os.path.join(ici, 'apercu.png'), [
        (-66, 26, [(corps, sombre, (0, 0, 0)), (motif, clair, (0, 0, 0))], 10.4),
        (-66, 26, [(corps, sombre, (0, 0, 0)), (motif, clair, (0, 0, 7))], 10.4),
    ])

    print('\n%.0f × %.0f × %.0f mm pleine, coins R%.2f' % (COTE, COTE, EPAISSEUR, RAYON_COIN))
    print('motif : %.1f mm de profondeur, du plan %.1f mm au plan %.1f mm'
          % (PROFONDEUR_MOTIF, Z_MOTIF, EPAISSEUR))


if __name__ == '__main__':
    main()
