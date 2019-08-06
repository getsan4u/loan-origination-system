Create User and Organization


Create Variables
  read in json file (seed_variables.json)
  iterate through variables and add organization reference
  variables have a reference to the strategy (x times it's associated with the strategy, will need to be updated after strat created)
  create variable map indexed with variable name

Create Rules
  read in json file (seed_rules.json)
  iterate through rules and add organization and variable references (iterate over multiple rules, grab variable_name, look up id, add to "state_property_attribute")
  strategy will stay blank until it's created

Create Strategy
  read in json file (seed_strategy.json)
  Object.keys(strategy.modules) - iterate through modules (each is an array) - iterate through array and update ruleset references (array) and conditions references (array)

Go back and update variables with strategy
Go back and update rules with strategy
