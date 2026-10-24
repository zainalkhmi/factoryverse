import { describe, expect, it } from 'vitest';
import { LabelGeneratorService } from './label-generator-service';

describe('LabelGeneratorService (Vuforia Toolchain Parity)', () => {
  const service = new LabelGeneratorService();

  it('should generate valid SVG QR code string with standard XML markup', () => {
    const svg = service.generateQRCodeSVG('FACTORYVERSE:EQUIP:EQUIP-CYL-8821', 120);
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="0 0 120 120"');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('<rect');
  });

  it('should be deterministic for the same payload', () => {
    const svg1 = service.generateQRCodeSVG('TEST-PAYLOAD-123', 100);
    const svg2 = service.generateQRCodeSVG('TEST-PAYLOAD-123', 100);
    expect(svg1).toBe(svg2);
  });

  it('should produce distinct SVGs for different payloads', () => {
    const svgA = service.generateQRCodeSVG('PAYLOAD-A', 100);
    const svgB = service.generateQRCodeSVG('PAYLOAD-B', 100);
    expect(svgA).not.toBe(svgB);
  });
});
