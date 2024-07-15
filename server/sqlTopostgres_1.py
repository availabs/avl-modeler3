import pandas as pd
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String
from sqlalchemy.orm import sessionmaker

# Define SQLAlchemy engine and session
sqlite_db = 'database/activitysimserver_old.sqlite'
postgresql_db = 'postgresql://dama_dev_user:57e5b991-630f-4ca8-8078-f552744a2cf1@mercury.availabs.org:5532/kari'

sqlite_engine = create_engine(f'sqlite:///{sqlite_db}')
Session = sessionmaker(bind=sqlite_engine)
session = Session()

postgres_engine = create_engine(postgresql_db)
Session = sessionmaker(bind=postgres_engine)
postgres_session = Session()

# Reflect SQLite table schema using MetaData
metadata = MetaData()
projects_sqlite = Table('psam_h36', metadata, autoload_with=sqlite_engine)

# Extract columns and their types from SQLite table
columns = [Column(col.name, col.type) for col in projects_sqlite.columns]

# Define the PostgreSQL table with schema and dynamically generated columns
metadata_postgres = MetaData(schema='avl_modeler_datasets')
projects_postgres = Table('psam_h36', metadata_postgres, *columns)

# Create the table in PostgreSQL
metadata_postgres.create_all(postgres_engine)

# Transfer data from SQLite to PostgreSQL
sqlite_projects = session.query(projects_sqlite).all()
for proj in sqlite_projects:
    postgres_session.execute(projects_postgres.insert().values(proj))
postgres_session.commit()

print("Data transferred successfully.")

# Close connections
session.close()
postgres_session.close()
