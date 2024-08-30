import pandas as pd

# Load the CSV file
file_path = 'HDFC_Coops_Geocoded_tractIDs_1.csv'
data = pd.read_csv(file_path)

# Aggregate the data based on the GEOID column and get the counts
aggregated_data = data.groupby('GEOID').size().reset_index(name='counts')

# Define the output file path
output_file_path = 'Aggregated_HDFC_Coops_Geocoded_GEOID.csv'

# Save the aggregated data to a new CSV file
aggregated_data.to_csv(output_file_path, index=False)

# Display the aggregated data (optional)
print(aggregated_data)
