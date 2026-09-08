import { map } from "lodash";
import React from "react";
import { Section, Select, InputNumber } from "@/components/visualizations/editor";
import { EditorPropTypes } from "@/visualizations/prop-types";

export default function GeneralSettings({ options, data, onOptionsChange }: any) {
  return (
    <React.Fragment>
      <Section>
        <Select
          layout="horizontal"
          label="Value Column"
          data-test="Gauge.General.ValueColumn"
          placeholder="Choose column..."
          defaultValue={options.counterColName || undefined}
          onChange={(counterColName: any) => onOptionsChange({ counterColName: counterColName || null })}
        >
          {map(data.columns, (col) => (
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'Option' does not exist on type '({ class... Remove this comment to see the full error message
            <Select.Option key={col.name} data-test={"Gauge.General.ValueColumn." + col.name}>
              {col.name}
              {/* @ts-expect-error ts-migrate(2339) FIXME: Property 'Option' does not exist on type '({ class... Remove this comment to see the full error message */}
            </Select.Option>
          ))}
        </Select>
      </Section>

      <Section>
        <InputNumber
          layout="horizontal"
          label="Value Row Number"
          data-test="Gauge.General.ValueRowNumber"
          defaultValue={options.rowNumber}
          onChange={(rowNumber: any) => onOptionsChange({ rowNumber })}
        />
      </Section>

      <Section>
        <InputNumber
          layout="horizontal"
          label="Min"
          data-test="Gauge.General.Min"
          defaultValue={options.min}
          onChange={(min: any) => onOptionsChange({ min })}
        />
      </Section>

      <Section>
        <InputNumber
          layout="horizontal"
          label="Max"
          data-test="Gauge.General.Max"
          defaultValue={options.max}
          onChange={(max: any) => onOptionsChange({ max })}
        />
      </Section>

      <Section>
        <Select
          layout="horizontal"
          label="Delta Column"
          data-test="Gauge.General.DeltaColumn"
          placeholder="No delta column"
          allowClear
          defaultValue={options.deltaColName || undefined}
          onChange={(deltaColName: any) => onOptionsChange({ deltaColName: deltaColName || null })}
        >
          {map(data.columns, (col) => (
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'Option' does not exist on type '({ class... Remove this comment to see the full error message
            <Select.Option key={col.name} data-test={"Gauge.General.DeltaColumn." + col.name}>
              {col.name}
              {/* @ts-expect-error ts-migrate(2339) FIXME: Property 'Option' does not exist on type '({ class... Remove this comment to see the full error message */}
            </Select.Option>
          ))}
        </Select>
      </Section>

      <Section>
        <InputNumber
          layout="horizontal"
          label="Delta Reference"
          data-test="Gauge.General.DeltaReference"
          defaultValue={options.deltaReference}
          disabled={!!options.deltaColName}
          onChange={(deltaReference: any) => onOptionsChange({ deltaReference })}
        />
      </Section>
    </React.Fragment>
  );
}

GeneralSettings.propTypes = EditorPropTypes;
