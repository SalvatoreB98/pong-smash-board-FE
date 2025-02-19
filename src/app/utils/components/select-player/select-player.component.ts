import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Utils } from '../../Utils';
import { TranslatePipe } from '../../translate.pipe';

@Component({
  selector: 'app-select-player',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './select-player.component.html',
  styleUrl: './select-player.component.scss'
})
export class SelectPlayerComponent {
  @Input() players: any[] = [];
  @Input() playerNumber: string = '';
  @ViewChild('searchInput') searchInput!: ElementRef; // ✅ Reference to input field

  constructor(private eRef: ElementRef) { }

  @Output() playerSelected = new EventEmitter<any>(); // Emit player selection

  searchCtrl = new FormControl('');
  filteredPlayers: any[] = [];
  showDropdown = false; // Controls dropdown visibility
  selectedPlayer: any = null; // Store selected player

  ngOnInit() {
    this.filteredPlayers = this.players;
    this.searchCtrl.valueChanges.subscribe(value => {
      console.log(value)
      return this.filterPlayers(value);
    });
    let width = document.querySelector('.input-field')?.clientWidth;
    if (!Utils.isMobile()) {
      document.querySelectorAll('.dropdown')?.forEach((dropdown) => {
        dropdown.setAttribute('style', `width: ${width}px`);
      })
    }
    window.addEventListener('resize', () => {
      let width = document.querySelector('.input-field')?.clientWidth;
      document.querySelectorAll('.dropdown')?.forEach((dropdown) => {
        dropdown.setAttribute('style', `width: ${width}px`);
      })
    });
  }

  ngOnDestroy() {
  }

  toggleDropdown(event?: Event) {
    this.searchCtrl.setValue('');
    this.showDropdown = !this.showDropdown;

    if (this.showDropdown) {
      // Add event listener for clicks outside
      setTimeout(() => {
        window.addEventListener('click', this.handleOutsideClick);
      });
    } else {
      // Remove event listener when dropdown is closed
      window.removeEventListener('click', this.handleOutsideClick);
    }
    if (this.showDropdown) {
      setTimeout(() => {
        this.searchInput.nativeElement.focus(); // ✅ Auto-focus input
      }, 50);
    }
  }

  handleOutsideClick = (event: Event) => {
    if (!this.eRef.nativeElement.contains(event.target as Node)) {
      this.showDropdown = false;
      window.removeEventListener('click', this.handleOutsideClick);
    }
  };

  filterPlayers(value: string | null) {
    const searchValue = (value ?? '').toLowerCase().trim(); // Normalize input

    // If search is empty, return all players
    this.filteredPlayers = searchValue
      ? this.players.filter(player =>
        player.name?.toLowerCase().includes(searchValue)
      )
      : [...this.players]; // Return full list without modifying original array
  }



  selectPlayer(player: any) {
    this.selectedPlayer = player;
    player.playerNumber = this.playerNumber; // Add player number to selected player
    this.playerSelected.emit(player); // Emit selected player
    this.showDropdown = false; // Close dropdown
  }
}

