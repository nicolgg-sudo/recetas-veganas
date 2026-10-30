"""Start/stop the local app; the Windows launcher opens the default browser."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import urllib.error
import urllib.request
import webbrowser

ROOT=Path(__file__).resolve().parent.parent
URL='http://127.0.0.1:8766'

def running():
    try:
        with urllib.request.urlopen(URL+'/health',timeout=1) as response:
            return json.load(response).get('app')=='verde-a-mano'
    except (OSError,ValueError):return False

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--stop',action='store_true');parser.add_argument('--no-browser',action='store_true');args=parser.parse_args()
    if args.stop:
        if running():
            req=urllib.request.Request(URL+'/shutdown',method='POST',headers={'X-Verde-Local':'stop'})
            urllib.request.urlopen(req,timeout=3).close()
            print('Recetario cerrado. Tus selecciones siguen guardadas en el navegador.')
        else:print('El recetario ya estaba cerrado.')
        return
    if not running():
        logdir=ROOT/'research';logdir.mkdir(exist_ok=True)
        with (logdir/'server.log').open('ab') as log:
            subprocess.Popen([sys.executable,str(ROOT/'scripts/serve.py')],cwd=str(ROOT),stdin=subprocess.DEVNULL,stdout=log,stderr=log,creationflags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0)
        for _ in range(30):
            if running():break
            time.sleep(.15)
        else:
            print('No se pudo abrir el recetario. El puerto 8766 puede estar ocupado. Consulta research/server.log.');sys.exit(1)
    if not args.no_browser:webbrowser.open(URL)
    print('Recetario listo en '+URL)

if __name__=='__main__':main()
