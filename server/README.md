1 - Create Conda Environment
conda env create --file=conda/env.yml --name ASIM_DEV
2 - Activate
conda activate ASIM_DEV
2.5 Install Population SIM in /lib/populationsim
python setup.py install --single-version-externally-managed --root=/
3 - Set Flask Index
export FLASK_APP=index
4 - Run Flask
flask run
