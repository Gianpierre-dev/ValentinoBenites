import { parsearNombre } from './parser-nombre';

describe('parsearNombre (migracion nombre -> modelo + color)', () => {
  describe('nombres con color conocido', () => {
    it('E4.2 separa el color final del modelo', () => {
      const r = parsearNombre('Bandolera Andina Vino');
      expect(r).toEqual({
        modelo: 'Bandolera Andina',
        color: 'Vino',
        requiereRevision: false,
      });
    });

    it('funciona para otro color y otro modelo (triangulacion)', () => {
      const r = parsearNombre('Bandolera Etnica Rosa');
      expect(r.modelo).toBe('Bandolera Etnica');
      expect(r.color).toBe('Rosa');
      expect(r.requiereRevision).toBe(false);
    });

    it('reconoce colores con acento normalizando la comparacion', () => {
      const r = parsearNombre('Bandolera Casual Marrón');
      expect(r.modelo).toBe('Bandolera Casual');
      expect(r.color).toBe('Marrón');
      expect(r.requiereRevision).toBe(false);
    });

    it('reconoce colores de dos palabras (mas largo primero)', () => {
      const r = parsearNombre('Bandolera Clásica Azul Marino');
      expect(r.modelo).toBe('Bandolera Clásica');
      expect(r.color).toBe('Azul Marino');
      expect(r.requiereRevision).toBe(false);
    });

    it('trata Multicolor como color valido', () => {
      const r = parsearNombre('Bandolera Andina Multicolor');
      expect(r.color).toBe('Multicolor');
      expect(r.modelo).toBe('Bandolera Andina');
      expect(r.requiereRevision).toBe(false);
    });
  });

  describe('nombres sin color reconocible (propone revision)', () => {
    it('E4 marca requiereRevision y color Único cuando no hay color final', () => {
      const r = parsearNombre('Cartera Shopper Andina');
      expect(r.color).toBe('Único');
      expect(r.modelo).toBe('Cartera Shopper Andina');
      expect(r.requiereRevision).toBe(true);
    });

    it('marca revision cuando el final es un calificativo de tamaño', () => {
      const r = parsearNombre('Cartera Tote Andina Grande');
      expect(r.color).toBe('Único');
      expect(r.requiereRevision).toBe(true);
    });

    it('marca revision ante un sufijo ambiguo (numeral romano)', () => {
      const r = parsearNombre('Bandolera Clásica Camel II');
      expect(r.requiereRevision).toBe(true);
      expect(r.color).toBe('Único');
    });
  });
});
