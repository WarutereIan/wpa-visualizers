import { map } from "lodash";
import React from "react";
import { Section, InputNumber, ColorPicker } from "@/components/visualizations/editor";
import { EditorPropTypes } from "@/visualizations/prop-types";
import ColorPalette from "@/visualizations/ColorPalette";

function updateThreshold(thresholds: any[], index: number, patch: any) {
  return map(thresholds, (threshold, i) => (i === index ? { ...threshold, ...patch } : threshold));
}

export default function AppearanceSettings({ options, onOptionsChange }: any) {
  return (
    <React.Fragment>
      {map(options.thresholds, (threshold: any, index: number) => (
        <React.Fragment key={index}>
          <Section>
            <InputNumber
              layout="horizontal"
              label={`Threshold ${index + 1} From`}
              data-test={`Gauge.Appearance.Threshold.${index}.From`}
              value={threshold.range[0]}
              onChange={(from: any) =>
                onOptionsChange({
                  thresholds: updateThreshold(options.thresholds, index, { range: [from, threshold.range[1]] }),
                })
              }
            />
          </Section>
          <Section>
            <InputNumber
              layout="horizontal"
              label={`Threshold ${index + 1} To`}
              data-test={`Gauge.Appearance.Threshold.${index}.To`}
              value={threshold.range[1]}
              onChange={(to: any) =>
                onOptionsChange({
                  thresholds: updateThreshold(options.thresholds, index, { range: [threshold.range[0], to] }),
                })
              }
            />
          </Section>
          <Section>
            <ColorPicker
              layout="horizontal"
              label={`Threshold ${index + 1} Color`}
              data-test={`Gauge.Appearance.Threshold.${index}.Color`}
              interactive
              presetColors={ColorPalette}
              color={threshold.color}
              onChange={(color: any) =>
                onOptionsChange({
                  thresholds: updateThreshold(options.thresholds, index, { color }),
                })
              }
              // @ts-expect-error ts-migrate(2339) FIXME: Property 'Label' does not exist on type '({ classN... Remove this comment to see the full error message
              addonAfter={<ColorPicker.Label color={threshold.color} presetColors={ColorPalette} />}
            />
          </Section>
        </React.Fragment>
      ))}
    </React.Fragment>
  );
}

AppearanceSettings.propTypes = EditorPropTypes;
