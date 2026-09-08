-- Allow TREEMAP as a first-class visualization type (Plotly treemap).

alter table public.visualizations
  drop constraint if exists visualizations_type_check;

alter table public.visualizations
  add constraint visualizations_type_check
  check (type in (
    'CHART','TABLE','COUNTER','GAUGE','PIVOT','FUNNEL','SANKEY',
    'SUNBURST_SEQUENCE','MAP','CHOROPLETH','COHORT','WORD_CLOUD','DETAILS','TREEMAP'));
