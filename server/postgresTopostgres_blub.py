import pandas as pd
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, LargeBinary
from sqlalchemy.orm import sessionmaker

# Define SQLAlchemy engine and session for Mercury (source) and Neptune (destination)
mercury_db = 'postgresql://dama_dev_user:57e5b991-630f-4ca8-8078-f552744a2cf1@mercury.availabs.org:5532/kari'
neptune_db = 'postgresql://postgres:1234@neptune.availabs.org:5437/postgres'

mercury_engine = create_engine(mercury_db)
neptune_engine = create_engine(neptune_db)

Mercury_Session = sessionmaker(bind=mercury_engine)
Neptune_Session = sessionmaker(bind=neptune_engine)

mercury_session = Mercury_Session()
neptune_session = Neptune_Session()

# Reflect Mercury table schema using MetaData
mercury_metadata = MetaData()
projects_mercury = Table('tl_2019_36_puma10', mercury_metadata, autoload_with=mercury_engine, schema='avl_modeler_datasets')

# Extract columns and their types from Mercury table
columns = []
for col in projects_mercury.columns:
    columns.append(Column(col.name, col.type))

# Define the Neptune table with schema and dynamically generated columns
neptune_metadata = MetaData(schema='avl_modeler_datasets')
projects_neptune = Table('tl_2019_36_puma10', neptune_metadata, *columns)

# Create the table in Neptune
neptune_metadata.create_all(neptune_engine)

# Transfer data from Mercury to Neptune
mercury_projects = mercury_session.query(projects_mercury).all()
for proj in mercury_projects:
    neptune_session.execute(projects_neptune.insert().values(**{col.name: getattr(proj, col.name) for col in projects_mercury.columns}))
neptune_session.commit()

print("Data transferred successfully from Mercury to Neptune.")

# Close connections
mercury_session.close()
neptune_session.close()