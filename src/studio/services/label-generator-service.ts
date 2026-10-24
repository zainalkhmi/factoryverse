/**
 * FactoryVerse Expert XR - Industrial Asset Tag & VuMark Label Generator
 * Vuforia Toolchain Parity: VuMark Designer & Target Manager Label Exporter
 * Generates high-resolution industrial labels with barcode/QR pattern, calibration specs,
 * and printable format for physical shop-floor machinery.
 */

import { SEED_EQUIPMENT_REGISTRY } from './barcode-scanner-service';
import type { EquipmentAsset } from '../../types';

export class LabelGeneratorService {
  /**
   * Generates a deterministic SVG QR/DataMatrix visual pattern
   */
  public generateQRCodeSVG(payload: string, size = 120): string {
    // Generate a high-contrast 21x21 QR pattern based on payload hash
    const matrixSize = 21;
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      hash = (hash << 5) - hash + payload.charCodeAt(i);
      hash |= 0;
    }

    const cellSize = (size / matrixSize).toFixed(2);
    let rects = '';

    // Standard 3 QR Finder Patterns (Top-Left, Top-Right, Bottom-Left)
    const drawFinderPattern = (startX: number, startY: number) => {
      // 7x7 outer box
      rects += `<rect x="${startX * Number(cellSize)}" y="${startY * Number(cellSize)}" width="${7 * Number(cellSize)}" height="${7 * Number(cellSize)}" fill="#000" rx="2" />`;
      rects += `<rect x="${(startX + 1) * Number(cellSize)}" y="${(startY + 1) * Number(cellSize)}" width="${5 * Number(cellSize)}" height="${5 * Number(cellSize)}" fill="#fff" />`;
      rects += `<rect x="${(startX + 2) * Number(cellSize)}" y="${(startY + 2) * Number(cellSize)}" width="${3 * Number(cellSize)}" height="${3 * Number(cellSize)}" fill="#000" rx="1" />`;
    };

    drawFinderPattern(0, 0);
    drawFinderPattern(14, 0);
    drawFinderPattern(0, 14);

    // Data modules derived deterministically from payload hash
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        // Skip finder zones
        if ((r < 7 && c < 7) || (r < 7 && c >= 14) || (r >= 14 && c < 7)) continue;

        const val = Math.abs(Math.sin((hash ^ (r * 31 + c * 17)) + r * c) * 10000);
        if (val - Math.floor(val) > 0.42) {
          rects += `<rect x="${c * Number(cellSize)}" y="${r * Number(cellSize)}" width="${cellSize}" height="${cellSize}" fill="#000" />`;
        }
      }
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <rect width="100%" height="100%" fill="#ffffff" rx="4"/>
        ${rects}
      </svg>
    `;
  }

  /**
   * Opens the Industrial Equipment Label Sheet Generator Modal
   */
  public openLabelGeneratorModal(): void {
    const existing = document.getElementById('label-generator-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'label-generator-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(4, 7, 12, 0.88);
      backdrop-filter: blur(8px);
      z-index: 99999;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: 'Inter', -apple-system, sans-serif;
    `;

    const equipmentList = SEED_EQUIPMENT_REGISTRY;

    modal.innerHTML = `
      <div style="background: #09111c; border: 1px solid #1e3a5f; border-radius: 12px; width: 900px; max-width: 95vw; max-height: 90vh; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); display: flex; flex-direction: column; overflow: hidden; color: #f1f5f9;">
        <!-- Header -->
        <div style="background: #0e1a2b; padding: 16px 24px; border-bottom: 1px solid #1e3a5f; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">🏷️</span>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #fff;">Equipment QR & VuMark Label Generator</h3>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">Vuforia Toolchain Parity: Printable Industrial Machine Tags & Tracking Markers</p>
            </div>
          </div>
          <button id="lbl-btn-close" style="background: transparent; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; padding: 4px 8px;">✕</button>
        </div>

        <!-- Label Gallery Scrollable Area -->
        <div id="printable-label-area" style="padding: 24px; overflow-y: auto; flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; background: #060a12;">
          ${equipmentList
            .map(
              (eq: EquipmentAsset) => `
            <div class="equipment-label-card" style="background: #ffffff; color: #0f172a; border: 2px solid #000; border-radius: 8px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); display: flex; flex-direction: column; justify-content: space-between; position: relative;">
              <!-- Header Strip -->
              <div style="border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #0284c7; text-transform: uppercase;">FACTORYVERSE EXPERT XR</div>
                  <div style="font-size: 14px; font-weight: 800; color: #000; margin-top: 1px;">INDUSTRIAL ASSET TAG</div>
                </div>
                <span style="font-size: 9px; font-weight: 800; background: #000; color: #fff; padding: 3px 6px; border-radius: 3px;">ISO 9001</span>
              </div>

              <!-- Main Body: QR Code + Metadata -->
              <div style="display: flex; gap: 14px; align-items: center;">
                <div style="flex-shrink: 0; border: 1px solid #cbd5e1; padding: 4px; border-radius: 4px; background: #fff;">
                  ${this.generateQRCodeSVG(eq.qrPayload, 110)}
                </div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.3;">${eq.name}</div>
                  <div style="font-size: 11px; font-family: monospace; font-weight: 700; color: #2563eb; margin-top: 4px;">TAG: ${eq.code}</div>
                  <div style="font-size: 10px; color: #475569; margin-top: 2px;">S/N: ${eq.serialNumber}</div>
                  <div style="font-size: 10px; color: #475569; margin-top: 1px;">LOC: ${eq.location}</div>
                  <div style="font-size: 9px; color: #16a34a; font-weight: 700; margin-top: 6px; background: #dcfce7; display: inline-block; padding: 2px 6px; border-radius: 2px;">
                    CALIBRATED · EXP: ${eq.calibrationDate}
                  </div>
                </div>
              </div>

              <!-- Bottom Barcode Simulation -->
              <div style="border-top: 1px dashed #94a3b8; margin-top: 12px; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #64748b; font-family: monospace;">
                <span>PAYLOAD: ${eq.qrPayload.slice(0, 24)}...</span>
                <span>SCAN WITH XR / STUDIO</span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        <!-- Footer Actions -->
        <div style="padding: 16px 24px; background: #0e1a2b; border-top: 1px solid #1e3a5f; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 12px; color: #94a3b8;">
            Ready to print on adhesive vinyl label sheets (Avery 5163 / Industrial 4x2" roll).
          </div>
          <div style="display: flex; gap: 10px;">
            <button id="lbl-btn-cancel" class="btn btn-secondary">Close</button>
            <button id="lbl-btn-print" class="btn btn-primary">
              <span>🖨️</span> Print Label Sheet
            </button>
          </div>
        </div>
      </div>

      <style>
        @media print {
          body * { visibility: hidden !important; }
          #printable-label-area, #printable-label-area * { visibility: visible !important; }
          #printable-label-area {
            position: absolute !important;
            left: 0 !important; top: 0 !important;
            width: 100% !important;
            background: #fff !important;
            padding: 0 !important;
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 15px !important;
          }
          .equipment-label-card {
            box-shadow: none !important;
            border: 2px solid #000 !important;
            page-break-inside: avoid !important;
          }
        }
      </style>
    `;

    document.body.appendChild(modal);

    const cleanup = () => modal.remove();
    modal.querySelector('#lbl-btn-close')?.addEventListener('click', cleanup);
    modal.querySelector('#lbl-btn-cancel')?.addEventListener('click', cleanup);

    modal.querySelector('#lbl-btn-print')?.addEventListener('click', () => {
      window.print();
    });
  }
}

export const labelGeneratorService = new LabelGeneratorService();
