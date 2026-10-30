"""Build the browser-readable catalog; no server or build tools required to use it."""
import json
import unicodedata
import re
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
CATEGORIES = ['Desayuno', 'Almuerzo', 'Cena', 'Snack', 'Postre']

def normalize(value):
    value = ''.join(c for c in unicodedata.normalize('NFD', value.lower()) if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', ' ', value)).strip()

def build():
    recipes = []
    names_to_load = ['breakfast-snacks.json','lunch-dinner.json','desserts.json']
    names_to_load += [p.name for p in sorted((ROOT/'data').glob('pinterest-*.json'))]
    for name in names_to_load:
        path = ROOT / 'data' / name
        if path.exists():
            recipes.extend(json.loads(path.read_text(encoding='utf-8-sig')))
    # Shared spellings prevent duplicate pantry entries for the same commercial ingredient.
    groups = {
        'harina de trigo': ['harina de trigo todo uso','harina de trigo de todo uso','harina de trigo común','harina de trigo común todo uso','harina todo uso','harina de trigo para todo uso'],
        'azúcar blanca': ['azúcar blanco','azúcar blanca granulada','azúcar granulada','azúcar blanco granulado'],
        'azúcar morena': ['azúcar moreno','azúcar morena clara','azúcar moreno claro','azúcar marrón claro','azúcar parda'],
        'azúcar en polvo': ['azúcar glas','azúcar impalpable','azúcar pulverizada','azúcar glass'],
        'leche de soya': ['bebida de soja','leche de soja','bebida de soya','bebida de soya sin azúcar','leche de soya sin azúcar','leche de soja sin azúcar'],
        'leche vegetal': ['bebida vegetal','leche vegetal sin azúcar','bebida vegetal sin azúcar'],
        'aceite vegetal': ['aceite de canola','aceite neutro','aceite vegetal neutro'],
        'aceite de oliva': ['aceite de oliva virgen extra','aceite de oliva extra virgen'],
        'mantequilla vegana': ['margarina vegana'],
        'guineo maduro': ['banana','banano','guineo','banana madura','banano maduro'],
        'mantequilla de maní': ['crema de cacahuete','mantequilla de cacahuete','mantequilla de cacahuate','crema de maní'],
        'garbanzo de lata': ['garbanzos en lata','garbanzos de lata','garbanzo en lata'],
        'garbanzo seco': ['garbanzos secos','garbanzos secos crudos','garbanzo seco crudo'],
        'habichuela roja de lata': ['habichuelas rojas de lata','frijoles rojos en lata','frijol rojo de lata','alubia roja en lata'],
        'habichuela blanca de lata': ['habichuelas blancas de lata','alubia blanca en lata','frijol blanco de lata','habichuela blanca en lata'],
        'tomate triturado de lata': ['tomates triturados en lata','tomate triturado en lata','tomate triturado','tomates triturados'],
        'tomate picado de lata': ['tomate en cubos de lata','tomates en cubos en lata','tomate en cubos en lata','tomate en dados en lata'],
        'pasta de tomate': ['concentrado de tomate','puré concentrado de tomate','tomate concentrado'],
        'ajo': ['diente de ajo','ajo fresco','dientes de ajo'],
        'cebolla': ['cebolla blanca','cebolla amarilla'],
        'limón amarillo': ['limón','jugo de limón','zumo de limón','jugo de limón fresco'],
        'vinagre blanco': ['vinagre blanco destilado'],
        'vinagre de manzana': ['vinagre de sidra de manzana'],
        'canela molida': ['canela en polvo','canela'],
        'comino molido': ['comino en polvo','comino'],
        'pimentón dulce': ['paprika','pimentón','paprika dulce','pimentón dulce molido'],
        'pimentón ahumado': ['paprika ahumada'],
        'cúrcuma molida': ['cúrcuma','cúrcuma en polvo'],
        'pimienta negra molida': ['pimienta negra','pimienta'],
        'cacao sin azúcar': ['cacao en polvo sin azúcar','cacao amargo en polvo','cacao en polvo'],
        'polvo de hornear': ['polvos de hornear','levadura química'],
        'bicarbonato de sodio': ['bicarbonato'],
        'linaza molida': ['semilla de linaza molida','semillas de lino molidas','semillas de linaza molidas','harina de linaza'],
        'maicena': ['almidón de maíz','fécula de maíz'],
        'extracto de vainilla': ['esencia de vainilla','vainilla'],
        'sal': ['sal fina','sal marina'],
        'agua': ['agua caliente','agua tibia','agua fría','agua hirviendo'],
        'levadura nutricional': ['levadura nutricional en copos'],
        'crema de coco en lata': ['crema de coco','crema de coco de lata','crema de coco en lata sin azúcar','crema de coco sin azúcar'],
        'leche de coco en lata': ['leche de coco','leche de coco de lata','leche de coco entera en lata','leche de coco en lata entera'],
        'avena en hojuelas': ['hojuelas de avena','avena arrollada','avena tradicional','avena'],
        'nuez': ['nueces'],
        'chispas de chocolate vegano': ['chispas de chocolate veganas','chips de chocolate vegano','chispas de chocolate sin lácteos','chispa de chocolate vegana'],
        'semilla de chía': ['semillas de chía','chía'],
        'caldo vegetal': ['caldo de verduras'],
        'champiñón': ['champiñones','champiñones frescos'],
        'perejil fresco': ['perejil'],
        'cilantro fresco': ['cilantro'],
        'albahaca fresca': ['albahaca'],
        'jengibre fresco': ['jengibre'],
        'arroz basmati seco': ['arroz basmati'],
        'mostaza Dijon': ['mostaza dijon'],
        'sirope de maple': ['sirope de arce'],
        'maíz en grano de lata': ['maíz de lata'],
        'aceituna verde': ['aceituna verde sin hueso'],
        'semilla de cilantro molida': ['cilantro molido'],
        'dátil Medjool sin semilla': ['dátil medjool','dátil Medjool sin hueso'],
    }
    alias = {normalize(v):normalize(canonical) for canonical, variants in groups.items() for v in [canonical,*variants]}
    names = {normalize(v):canonical for canonical, variants in groups.items() for v in [canonical,*variants]}
    ids = set()
    urls = set()
    for r in recipes:
        assert r['id'] not in ids, f"Duplicate id: {r['id']}"
        assert r['source']['url'] not in urls, f"Duplicate source: {r['source']['url']}"
        ids.add(r['id']); urls.add(r['source']['url'])
        assert r['category'] in CATEGORIES
        assert r['steps'] and all(isinstance(s,str) and len(s)>20 for s in r['steps']),r['id']
        for field in ['image','video']:
            if r.get(field): assert (ROOT/r[field]).is_file(),f"Missing {r[field]}"
        for i in r['ingredients']:
            if r['id'] in ['ld-03','ld-09'] and i['name'] == 'limón':
                i['name'] = 'limón verde'
            if normalize(i['name']) in ['jugo de limon','zumo de limon','jugo de limon fresco']:
                i['amount'] += ' de jugo exprimido (retirar las semillas)'
            i['name'] = names.get(normalize(i['name']), i['name'])
            assert i['amount'] and isinstance(i['optional'],bool),r['id']
        # Count all equipment actually mentioned by the beginner instructions.
        text = normalize(' '.join(r['steps']))
        inferred = []
        if any(re.search(r'\b'+word+r'\b', text) for word in ['bol','bowl','tazon']): inferred.append('bowl')
        if any(word in text for word in ['pica','corta','trocea','pela']): inferred.extend(['cuchillo','tabla de cortar'])
        if any(word in text for word in ['refrigera','nevera']): inferred.append('nevera')
        if any(word in text for word in ['congelador','congela']): inferred.append('congelador')
        if 'papel para hornear' in text or 'papel de hornear' in text: inferred.append('papel para hornear')
        if 'ralla' in text: inferred.append('rallador')
        if 'espatula' in text: inferred.append('espátula')
        if 'cuchara' in text: inferred.append('cuchara')
        if 'frasco' in text or 'recipiente con tapa' in text: inferred.append('recipiente con tapa')
        r['equipment'] = list(dict.fromkeys(r['equipment']+inferred))
        r.setdefault('waitNote','')
        r.setdefault('adaptationNote','')
        if r['id'] == 'ld-16':
            r['minutes'] = 70
            r['description'] += ' Incluye 30 minutos previos de prensado.'
        if r['id'] == 'ld-05':
            r['minutes'] = 45
            r['description'] = 'Salteado de vegetales y cajuil. Unos 15 min si el arroz ya está preparado; calcula 45 min desde arroz seco.'
            r['adaptationNote'] = 'La fuente parte de 4 tazas de arroz cocido. Esta ficha añade una preparación básica de arroz blanco de grano largo con la proporción del fabricante Mahatma (2 partes de agua por 1 de arroz). El rendimiento varía: mide las 4 tazas cocidas para el salteado y guarda el sobrante. Si tu envase indica otra proporción, sigue la de tu arroz.'
            r['ingredients'] = [i for i in r['ingredients'] if i['name'] != 'agua']
            for i in r['ingredients']:
                if i['name'] == 'arroz blanco seco': i['amount'] = '1½ tazas para preparar al menos 4 tazas cocidas; usar 4 tazas en el salteado'
            r['ingredients'].append({'name':'agua','amount':'3 tazas (720 ml) para preparar el arroz','optional':False})
            r['steps'][0] = 'Si no tienes arroz preparado, lleva 3 tazas (720 ml) de agua a ebullición en un caldero. Agrega 1½ tazas de arroz blanco de grano largo, remueve una vez y tapa. Baja a fuego mínimo y cocina unos 20 minutos, hasta que se absorba el agua; no debe quedar agua libre al inclinar ligeramente el recipiente. Apaga, deja reposar tapado 5 minutos y separa los granos con un tenedor. Mide 4 tazas de arroz cocido para esta receta. Si tu envase indica otra proporción de agua o tiempo, usa esos valores. El salteado original tarda 15 minutos; calcula unos 45 minutos al preparar también el arroz.'
            r['equipment'] = list(dict.fromkeys(r['equipment']+['caldero','tenedor']))
            r['additionalSources'] = [{'name':'Preparación de arroz blanco · Mahatma','url':'https://mahatmarice.com/products/white-rice/'}]
    # Interleave the five categories so the first screen shows variety.
    pools = {c:[r for r in recipes if r['category']==c] for c in CATEGORIES}
    interleaved = [pools[c][n] for n in range(max([len(v) for v in pools.values()],default=0)) for c in CATEGORIES if n<len(pools[c])]
    additions=json.loads((ROOT/'data/extra-pantry.json').read_text(encoding='utf-8-sig'))
    result = '/* Generated by scripts/build-catalog.py. Edit the JSON sources, then rebuild. */\n'
    result += 'window.RECIPES = '+json.dumps(interleaved,ensure_ascii=False)+';\n'
    result += 'window.INGREDIENT_ALIASES = '+json.dumps(alias,ensure_ascii=False)+';\n'
    result += 'window.PANTRY_ADDITIONS = '+json.dumps(additions,ensure_ascii=False)+';\n'
    board_path=ROOT/'data/board-index.json'
    board=json.loads(board_path.read_text(encoding='utf-8-sig')) if board_path.exists() else {'pins':[]}
    for pin in board['pins']:
        if pin.get('recipeId'): assert pin['recipeId'] in ids, pin['recipeId']
        for field in ['image','video']:
            if pin.get(field): assert (ROOT/pin[field]).is_file(), f"Missing pin media {pin[field]}"
    result += 'window.PINTEREST_BOARD = '+json.dumps(board,ensure_ascii=False)+';\n'
    (ROOT/'data/catalog.js').write_text(result,encoding='utf-8')
    print(json.dumps({'recipes':len(recipes),'categories':dict(Counter(r['category'] for r in recipes)),'photos':sum(bool(r.get('image')) for r in recipes),'videos':sum(bool(r.get('video')) for r in recipes),'ingredients':len({normalize(i['name']) for r in recipes for i in r['ingredients']})},ensure_ascii=False))

if __name__=='__main__': build()
