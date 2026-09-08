import { map } from "lodash";
import React from "react";
import { Section, Select } from "@/components/visualizations/editor";
import { EditorPropTypes } from "@/visualizations/prop-types";

export default function Editor({ options, data, onOptionsChange }: any) {
  return (
    <React.Fragment>
      <Section>
        <Select
          layout="horizontal"
          label="Labels Column"
          data-test="Treemap.General.LabelsColumn"
          placeholder="Choose column..."
          defaultValue={options.labelsColName || undefined}
          onChange={(labelsColName: any) => onOptionsChange({ labelsColName: labelsColName || null })}
        >
          {map(data.columns, (col) => (
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'Option' does not exist on type '({ class... Remove this comment to see the full error message
            <Select.Option key={col.name} data-test={"Treemap.General.LabelsColumn." + col.name}>
              {col.name}
              {/* @ts-expect-error ts-migrate(2339) FIXME: Property 'Option' does not exist on type '({ class... Remove this comment to see the full error message */}
            </Select.Option>
          ))}
        </Select>
      </Section>

      <Section>
        <Select
          layout="horizontal"
          label="Parents Column"
          data-test="Treemap.General.ParentsColumn"
          placeholder="No parent column"
          allowClear
          defaultValue={options.parentsColName || undefined}
          onChange={(parentsColName: any) => onOptionsChange({ parentsColName: parentsColName || null })}
        >
          {map(data.columns, (col) => (
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'Option' does not exist on type '({ class... Remove this comment to see the full error message
            <Select.Option key={col.name} data-test={"Treemap.General.ParentsColumn." + col.name}>
              {col.name}
              {/* @ts-expect-error ts-migrate(2339) FIXME: Property 'Option' does not exist on type '({ class... Remove this comment to see the full error message */}
            </Select.Option>
          ))}
        </Select>
      </Section>

      <Section>
        <Select
          layout="horizontal"
          label="Values Column"
          data-test="Treemap.General.ValuesColumn"
          placeholder="Choose column..."
          defaultValue={options.valuesColName || undefined}
          onChange={(valuesColName: any) => onOptionsChange({ valuesColName: valuesColName || null })}
        >
          {map(data.columns, (col) => (
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'Option' does not exist on type '({ class... Remove this comment to see the full error message
            <Select.Option key={col.name} data-test={"Treemap.General.ValuesColumn." + col.name}>
              {col.name}
              {/* @ts-expect-error ts-migrate(2339) FIXME: Property 'Option' does not exist on type '({ class... Remove this comment to see the full error message */}
            </Select.Option>
          ))}
        </Select>
      </Section>

      <Section>
        <Select
          layout="horizontal"
          label="Color Column"
          data-test="Treemap.General.ColorColumn"
          placeholder="No color column"
          allowClear
          defaultValue={options.colorColName || undefined}
          onChange={(colorColName: any) => onOptionsChange({ colorColName: colorColName || null })}
        >
          {map(data.columns, (col) => (
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'Option' does not exist on type '({ class... Remove this comment to see the full error message
            <Select.Option key={col.name} data-test={"Treemap.General.ColorColumn." + col.name}>
              {col.name}
              {/* @ts-expect-error ts-migrate(2339) FIXME: Property 'Option' does not exist on type '({ class... Remove this comment to see the full error message */}
            </Select.Option>
          ))}
        </Select>
      </Section>
    </React.Fragment>
  );
}

Editor.propTypes = EditorPropTypes;
