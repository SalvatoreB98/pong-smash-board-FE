import { Component, Input } from '@angular/core';
import { CompetitionMode, IMatch } from '../../interfaces/matchesInterfaces';
import { KnockoutStage } from '../../utils/enum';
import { SHARED_IMPORTS } from '../imports/shared.imports';

type MatchWithContext = IMatch & {
  competitionType?: CompetitionMode;
  competitionName?: string;
  roundName?: KnockoutStage | null;
  roundLabel?: KnockoutStage | string | null;
};

@Component({
  selector: 'app-set-match-date-modal',
  imports: [...SHARED_IMPORTS],
  templateUrl: './set-match-date-modal.component.html',
  styleUrl: './set-match-date-modal.component.scss'
})


export class SetMatchDateModalComponent {
  @Input() match: MatchWithContext | undefined;
}
