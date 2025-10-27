import { AfterViewInit, Component, EventEmitter, OnChanges, OnDestroy, SimpleChanges, inject, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';
import { CompetitionType, ICompetition } from '../../../../api/competition.api';
import { ModalService } from '../../../../services/modal.service';
import { MSG_TYPE } from '../../../utils/enum';
import { CompetitionService } from '../../../../services/competitions.service';
import { LoaderService } from '../../../../services/loader.service';
import { TranslationService } from '../../../../services/translation.service';
import { ModalComponent } from '../../../common/modal/modal.component';
import { AreYouSureComponent } from '../../../common/are-you-sure/are-you-sure.component';
import { Subscription } from 'rxjs';
import { DropdownAction, DropdownService } from '../../../../services/dropdown.service';
import { Router } from '@angular/router';
import { Navigation } from 'swiper/modules';
import { SwiperOptions } from 'swiper/types';
import { BASE_SLIDER_CONFIG } from '../../../config/slider.config';
import { SwiperManager } from '../../../utils/helpers/swiper.manager';

@Component({
  selector: 'app-competition-detail',
  imports: [...SHARED_IMPORTS],
  templateUrl: './competition-detail.component.html',
  styleUrl: './competition-detail.component.scss'
})
export class CompetitionDetailComponent implements OnChanges, AfterViewInit, OnDestroy {

  @Input() competition: ICompetition | null = null;

  @ViewChild('competitionDetail', { static: true }) competitionDetailRef!: ElementRef<HTMLElement>;
  @ViewChild('playersSlider') playersSlider?: ElementRef<HTMLElement>;

  swiperConfig: SwiperOptions = {
    ...BASE_SLIDER_CONFIG,
    modules: [Navigation],
    navigation: true
  };
  private playersSwiperManager = new SwiperManager(() => this.playersSlider?.nativeElement ?? null, this.swiperConfig);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['competition']) {
      this.playersSwiperManager.queueUpdate();
    }
  }
  @Output() actionSelected = new EventEmitter<{ action: string, competition: ICompetition | null }>();
  @Output() changeCompetitionSelected = new EventEmitter<ICompetition>();
  @Output() deletePlayerRequested = new EventEmitter<number>();
  @Output() deleteCompetitionRequested = new EventEmitter<ICompetition | null>();
  copied: boolean = false;
  private competitionService = inject(CompetitionService);
  public dropdownService = inject(DropdownService);
  activeCompetition$ = this.competitionService.activeCompetition$;

  constructor(public modalService: ModalService, private loader: LoaderService, private translateService: TranslationService, private router: Router) {
    this.registerDropdownHandlers();
  }

  readonly detailsModalName = 'viewCompetitionModal';
  readonly editModalName = 'editCompetitionModal';
  readonly detailMenuActions: DropdownAction[] = [
    { label: 'Set as favorite', value: 'favorite', icon: '<i class="fa-solid fa-star"></i>' },
    { label: 'Details', value: 'details', icon: '<i class="fa-solid fa-circle-info"></i>' },
    { label: 'Delete', value: 'delete', icon: '<i class="fa-solid fa-trash"></i>', danger: true }
  ];

  ngOnInit() {
    this.subscriptions.add(this.activeCompetition$.subscribe(comp => {
      this.competition = comp;
      this.playersSwiperManager.queueUpdate();
    }));
  }

  ngAfterViewInit(): void {
    this.playersSwiperManager.init();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.playersSwiperManager.destroy();
  }

  isEmpty(array: any): boolean {
    return !array || (Array.isArray(array) && array.length === 0);
  }

  onDropdownAction(action: string) {
    if (!this.competition?.id) {
      return;
    }

    switch (action) {
      case 'favorite':
        this.competitionService.updateActiveCompetition(this.competition.id).subscribe();
        window.location.reload();
        break;
      case 'delete':
        this.deleteCompetitionRequested.emit(this.competition);
        break;
      case 'details':
        this.changeCompetitionSelected.emit(this.competition);
        this.modalService.openModal(this.detailsModalName);
        break;
      case 'edit':
        this.modalService.openModal(this.editModalName);
        break;
    }

    this.actionSelected.emit({ action, competition: this.competition });
  }

  copyCode() {
    this.activeCompetition$.subscribe(comp => {
      console.log(comp);
      if (comp?.['code']) {
        navigator.clipboard.writeText(comp['code'])
          .then(() => {
            this.loader.showToast(this.translateService.translate('code_copied'), MSG_TYPE.SUCCESS);
            setTimeout(() => this.copied = false, 2000); // reset messaggio dopo 2s
          })
          .catch(() => {
            this.loader.showToast(this.translateService.translate('code_copy_failed'), MSG_TYPE.ERROR);
          });
      } else {
        this.loader.showToast(this.translateService.translate('code_not_available'), MSG_TYPE.ERROR);
      }
    });
  }

  getCompetitionTypeIcon(type?: CompetitionType | string | null): string {
    switch (type) {
      case 'elimination':
        return 'fa-sitemap';
      case 'group_knockout':
        return 'fa-diagram-project';
      default:
        return 'fa-users';
    }
  }
  deletePlayer(playerId: number) {
    if (!this.competition?.id) {
      return;
    }
    this.competitionService.removePlayerFromCompetition(this.competition.id, playerId).subscribe(() => {
      this.competition?.players?.splice(this.competition.players.findIndex(p => p.id === playerId), 1);
      this.loader.showToast(this.translateService.translate('player_removed'), MSG_TYPE.SUCCESS);
      this.playersSwiperManager.queueUpdate();
    });
  }

  requestPlayerDeletion(playerId: number) {
    this.deletePlayerRequested.emit(playerId);
  }

  private subscriptions = new Subscription();
  private dropdownTrigger: HTMLElement | null = null;

  private registerDropdownHandlers() {
    this.subscriptions.add(
      this.dropdownService.state$.subscribe((state) => {
        if (!state) {
          this.dropdownTrigger = null;
          return;
        }

        const trigger = state.trigger;
        if (!trigger || trigger.dataset['dropdownSource'] !== 'competition-detail') {
          this.dropdownTrigger = null;
          return;
        }

        this.dropdownTrigger = trigger;
      })
    );

    this.subscriptions.add(
      this.dropdownService.action$.subscribe((value) => {
        if (this.dropdownTrigger?.dataset['dropdownSource'] !== 'competition-detail') {
          return;
        }

        this.onDropdownAction(value);
        this.dropdownTrigger = null;
      })
    );
  }
  goToMatches(compId: number | string = '') {
    this.competitionService.updateActiveCompetition(compId).subscribe(() => {
      this.router.navigate(['/home']);
    });
  }
}
