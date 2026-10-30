"""Verify a downloaded copy using only the Python standard library."""
import sys
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent

def main():
    if sys.version_info < (3,10):
        print('ERROR: se necesita Python 3.10 o posterior.');return 1
    problems=[]
    for name in ['index.html','app.js','styles.css','data/catalog.js','scripts/launch.py','scripts/serve.py','scripts/build-catalog.py']:
        if not (ROOT/name).is_file():problems.append('Falta '+name)
    if problems:
        print('\n'.join(problems));return 1
    text=(ROOT/'data/catalog.js').read_text(encoding='utf-8')
    try:
        raw=text.split('window.RECIPES = ',1)[1].split(';\nwindow.INGREDIENT_ALIASES',1)[0]
        recipes=json.loads(raw)
        assert isinstance(recipes,list) and recipes
    except (ValueError,IndexError,AssertionError):
        print('ERROR: el catalogo compilado no se pudo leer.');return 1
    ids=[r.get('id') for r in recipes]
    if len(ids)!=len(set(ids)):problems.append('Hay identificadores de recetas repetidos.')
    media=set()
    for recipe in recipes:
        if not recipe.get('ingredients') or not recipe.get('steps'):problems.append('Ficha incompleta: '+str(recipe.get('id')))
        for field in ['image','video']:
            value=recipe.get(field)
            if not value:continue
            target=(ROOT/value).resolve()
            if not target.is_relative_to(ROOT):problems.append('Ruta fuera del proyecto: '+value);continue
            if not target.is_file():problems.append('Falta medio: '+value);continue
            media.add(value)
    for value in sorted(media):
        with (ROOT/value).open('rb') as f:signature=f.read(12)
        if value.lower().endswith(('.jpg','.jpeg')) and not signature.startswith(b'\xff\xd8'):problems.append('Imagen no valida: '+value)
        if value.lower().endswith('.mp4') and signature[4:8]!=b'ftyp':problems.append('Video no valido: '+value)
    for name in ['breakfast-snacks.json','lunch-dinner.json','desserts.json','extra-pantry.json']:
        try:json.loads((ROOT/'data'/name).read_text(encoding='utf-8-sig'))
        except (OSError,ValueError):problems.append('JSON de origen no valido o ausente: '+name)
    for source in (ROOT/'data').glob('pinterest-*.json'):
        try:json.loads(source.read_text(encoding='utf-8-sig'))
        except (OSError,ValueError):problems.append('JSON no valido: '+source.name)
    board_file=ROOT/'data/board-index.json'
    try:
        board=json.loads(board_file.read_text(encoding='utf-8-sig'));pins=board.get('pins',[])
        if len(pins)!=len({p.get('pinUrl') for p in pins}):problems.append('El inventario contiene pines repetidos.')
        if any(p.get('recipeId') not in ids for p in pins):problems.append('Un pin no tiene su ficha correspondiente.')
    except (OSError,ValueError,TypeError):problems.append('El inventario del tablero no se pudo leer.');pins=[]
    if problems:
        print('ERROR: la copia necesita atencion.');print('\n'.join('- '+p for p in problems));return 1
    photos=sum(bool(r.get('image')) for r in recipes)
    videos=sum(bool(r.get('video')) for r in recipes)
    print(f'OK: {len(recipes)} recetas, {photos} fotos y {videos} videos locales.')
    print(f'OK: {len(pins)} pines asociados a sus recetas.')
    print('Copia lista. Ejecuta scripts/launch.py con este mismo Python.');return 0

if __name__=='__main__':raise SystemExit(main())
