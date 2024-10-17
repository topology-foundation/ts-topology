#!/bin/bash

# Local Testing Guide Script

# Function to check if pnpm is installed
check_pnpm_installed() {
    if ! command -v pnpm &> /dev/null
    then
        echo "pnpm could not be found. Please install pnpm and try again."
        exit 1
    fi
}

# Step 2: Check if pnpm is installed
check_pnpm_installed

# Step 3: Install dependencies using pnpm
install_dependencies() {
    echo "Installing dependencies..."
    pnpm install
    echo "Dependencies installed."
}

# Step 4: Run the local bootstrap node
run_local_bootstrap_node() {
    echo "Running the local bootstrap node..."
    # Replace the command below with the actual one to run the bootstrap node
    cd packages/node
    pnpm cli relay --config configs/bootstrap.json
    echo "Local bootstrap node is running."
}

# Step 5: Update the local bootstrap node path in bootstrap.json
update_bootstrap_node_path() {
    echo "Updating the bootstrap node path..."
    # Replace this with the actual JSON key update if required
    sed -i 's|/path/to/default/bootstrap|/path/to/local/bootstrap|g' packages/node/configs/bootstrap.json
    echo "Bootstrap node path updated."
}

# Step 6: Run the example file
run_example_file() {
    echo "Running the example file..."
    # Replace this with the actual example command
    pnpm run start:example-file
    echo "Example file executed."
}

# Main Execution Flow
clone_repository
install_dependencies
run_local_bootstrap_node
# update_bootstrap_node_path
# run_example_file

echo "Local testing completed successfully."