import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../translate.pipe';

@Component({
  selector: 'app-select-player',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './select-player.component.html',
  styleUrls: ['./select-player.component.scss'],
})
export class SelectPlayerComponent implements OnInit, OnChanges {
  @Input() players: { id?: number; nickname: string }[] = [];
  @Input() playerNumber: string = '';
  @Input() selectedPlayerId: number | string | null = null;

  @Output() playerSelected = new EventEmitter<any>();

  @ViewChild('searchInput') searchInput!: ElementRef;

  searchCtrl = new FormControl('');
  filteredPlayers: any[] = [];
  showDropdown = false;
  selectedPlayer: any = null;

  ngOnInit() {
    this.filteredPlayers = [...this.players];

    this.searchCtrl.valueChanges.subscribe((value) => {
      this.filterPlayers(value);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['players'] && this.players) {
      this.filteredPlayers = [...this.players];
    }

    if (changes['selectedPlayerId'] || changes['players']) {
      this.updateSelectedPlayer();
    }
  }

  private updateSelectedPlayer() {
    const parsedId = this.parseSelectedPlayerId(this.selectedPlayerId);
    if (parsedId === null) {
      this.selectedPlayer = null;
      return;
    }

    const matchedPlayer = this.players.find((player) => player.id === parsedId) || null;
    this.selectedPlayer = matchedPlayer;
  }

  private parseSelectedPlayerId(value: number | string | null): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isNaN(value) ? null : value;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  toggleDropdown(event: Event) {
    event.stopPropagation(); // non propagare al document
    this.searchCtrl.setValue('');
    this.showDropdown = !this.showDropdown;

    if (this.showDropdown) {
      setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
    }
  }

  closeDropdown() {
    this.showDropdown = false;
  }

  filterPlayers(value: string | null) {
    const searchValue = (value ?? '').toLowerCase().trim();

    this.filteredPlayers = searchValue
      ? this.players.filter((player) =>
          (player.nickname || '').toLowerCase().includes(searchValue)
        )
      : [...this.players];
  }

  selectPlayer(player: any, event: Event) {
    event.stopPropagation();
    this.selectedPlayer = player;
    player.playerNumber = this.playerNumber;
    this.playerSelected.emit(player);
    this.closeDropdown();
  }
}
