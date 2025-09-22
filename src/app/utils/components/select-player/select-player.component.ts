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
import { IPlayer } from '../../../../services/players.service';

@Component({
  selector: 'app-select-player',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './select-player.component.html',
  styleUrls: ['./select-player.component.scss'],
})
export class SelectPlayerComponent implements OnInit, OnChanges {
  @Input() players: IPlayer[] = [];
  @Input() playerNumber: string = '';
  @Input() initialPlayer: IPlayer | null = null;

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

    if (changes['players'] || changes['initialPlayer']) {
      this.setSelectedPlayer();
    }
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

  private setSelectedPlayer() {
    if (this.initialPlayer?.id) {
      const matchedPlayer = this.players.find(
        (player) => player.id === this.initialPlayer?.id
      );
      if (matchedPlayer) {
        this.selectedPlayer = matchedPlayer;
        return;
      }
    }

    this.selectedPlayer = null;
  }
}
