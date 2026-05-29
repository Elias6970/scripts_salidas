import { Injectable } from '@angular/core';
import { InstrumentGroup } from './xlsx-processing.service';

@Injectable({
  providedIn: 'root'
})
export class InstrumentSortService {
  // Hardcoded list of instruments defining the custom order.
  // Update this list with your actual instruments in the desired order.
  private readonly customOrder = [
    'Flautin',
    'Flauta',
    'Flauta 1',
    'Flauta 2',
    'Oboe',
    'Oboe 1',
    'Oboe 2',
    'Clarinete',
    'Clarinete Principal',
    'Clarinete Pral',
    'Clarinete 1',
    'Clarinete 2',
    'Clarinete 3',
    'Saxo Alto',
    'Saxo Alto 1',
    'Saxo Alto 2',
    'Saxofón Alto',
    'Saxofón Alto 1',
    'Saxofón Alto 2',
    'Saxo Tenor',
    'Saxo Tenor 1',
    'Saxo Tenor 2',
    'Saxofón Tenor',
    'Saxofón Tenor 1',
    'Saxofón Tenor 2',
    'Tenor',
    'Tenor 1',
    'Tenor 2',
    'Trompa',
    'Trompa 1',
    'Trompa 2',
    'Trompa 3',
    'Trompa 4',
    'Fliscorno',
    'Fliscorno 1',
    'Fliscorno 2',
    'Trompeta',
    'Trompeta 1',
    'Trompeta 2',
    'Trompeta 3',
    'Trombón',
    'Trombón 1',
    'Trombón 2',
    'Trombón 3',
    'Bombardino',
    'Bombardino 1',
    'Bombardino 2',
    'Tuba',
    'Tuba 1',
    'Tuba 2',
    'Bajo',
    'Bajo 1',
    'Bajo 2',
    'Chello',
    'Violochello',
    'Contrabajo',
    'Percusión',
    'Percu'
  ];

  sortGroups(groups: InstrumentGroup[]): InstrumentGroup[] {
    return groups.sort((a, b) => {
      const instrA = a.instrument.toLowerCase();
      const instrB = b.instrument.toLowerCase();
      const indexA = this.customOrder.findIndex(inst => inst.toLowerCase() === instrA);
      const indexB = this.customOrder.findIndex(inst => inst.toLowerCase() === instrB);

      // Both instruments are in the custom order list
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // Only instrument A is in the list (so it comes first)
      if (indexA !== -1) return -1;
      
      // Only instrument B is in the list (so it comes first)
      if (indexB !== -1) return 1;

      // Unlisted instruments fallback to alphabetical order
      return instrA.localeCompare(instrB);
    });
  }
}
