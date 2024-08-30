import pandas as pd
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, LargeBinary
from sqlalchemy.orm import sessionmaker

# Define SQLAlchemy engine and session
sqlite_db = 'database/activitysimserver_old.sqlite'
# postgresql_db = 'postgresql://dama_dev_user:57e5b991-630f-4ca8-8078-f552744a2cf1@mercury.availabs.org:5532/kari'
postgresql_db = 'postgresql://postgres:1234@neptune.availabs.org:5437/postgres'

sqlite_engine = create_engine(f'sqlite:///{sqlite_db}')
Session = sessionmaker(bind=sqlite_engine)
session = Session()

postgres_engine = create_engine(postgresql_db)
Session = sessionmaker(bind=postgres_engine)
postgres_session = Session()

# Reflect SQLite table schema using MetaData
metadata = MetaData()
projects_sqlite = Table('tl_2019_36_puma10', metadata, autoload_with=sqlite_engine)

# Extract columns and their types from SQLite table
columns = []
for col in projects_sqlite.columns:
    if str(col.type) == 'BLOB':
        columns.append(Column(col.name, LargeBinary))  # Map BLOB to LargeBinary for PostgreSQL
    else:
        columns.append(Column(col.name, col.type))

# Define the PostgreSQL table with schema and dynamically generated columns
metadata_postgres = MetaData(schema='avl_modeler_datasets')
projects_postgres = Table('tl_2019_36_puma10', metadata_postgres, *columns)

# Create the table in PostgreSQL
metadata_postgres.create_all(postgres_engine)

# Transfer data from SQLite to PostgreSQL
sqlite_projects = session.query(projects_sqlite).all()
for proj in sqlite_projects:
    postgres_session.execute(projects_postgres.insert().values(**{col.name: getattr(proj, col.name) for col in projects_sqlite.columns}))
postgres_session.commit()

print("Data transferred successfully.")

# Close connections
session.close()
postgres_session.close()
