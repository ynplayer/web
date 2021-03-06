import {attributesKey} from '../../backbone/decorators/attributes-key.decorator';
import {defaultValue} from '../../backbone/decorators/default-value.decorator';
import {nested} from '../../backbone/decorators/nested.decorator';
import {SoundcloudProxyModel} from '../soundcloud/soundcloud-proxy.model';
import {IPlaylist} from './playlist.interface';
import {PlaylistItemsSoundcloudCollection} from './playlist-item/playlist-items-soundcloud.collection';
import {PlaylistItemSoundcloudModel} from './playlist-item/playlist-item-soundcloud.model';
import {ImageSoundcloudModel} from '../image/image-soundcloud.model';
import {ArtistCloudplayerModel} from '../artist/artist-cloudplayer.model';

export class PlaylistSoundcloudModel
  extends SoundcloudProxyModel implements IPlaylist {

  endpoint = '/playlists';

  @attributesKey('provider')
  @defaultValue('soundcloud')
  provider: string;

  @attributesKey('canEdit')
  @defaultValue(false)
  canEdit: boolean;

  @attributesKey('isPublic')
  @defaultValue(false)
  isPublic: boolean;

  @attributesKey('title')
  @defaultValue('')
  title: string;

  @attributesKey('description')
  description: string;

  @attributesKey('user')
  @nested()
  artist: ArtistCloudplayerModel;

  @attributesKey('items')
  @nested()
  items: PlaylistItemsSoundcloudCollection<PlaylistItemSoundcloudModel>;

  @attributesKey('artwork_url')
  @nested()
  image: ImageSoundcloudModel;

  parse(attrs: any) {
    attrs.isPublic = (attrs.sharing === 'public');
    delete attrs.sharing;

    if (!attrs.artwork_url && attrs.tracks.length > 0) {
      attrs.artwork_url = attrs.tracks[0].artwork_url;
    }

    if (attrs.tracks) {
      const parsedPlaylistItems = [];
      attrs.tracks.forEach((track) => {
        parsedPlaylistItems.push({
          id: track.id,
          track: track
        });
      });
      delete attrs.tracks;
      attrs.items = parsedPlaylistItems;
    }

    return attrs;
  }

  compose(attrs: any) {
    return {
      playlist: {
        title: attrs.title,
        sharing: attrs.isPublic ? 'public' : 'private',
        description: attrs.description,
        tracks: attrs.items
      }
    };
  }

  initialize(): void {
    if (this.id) {
      this.items.setEndpoint(this.id);
    }
    this.on('change:id', () => {
      this.items.setEndpoint(this.id);
    });
    this.items.on('save', (item) => {
      this.save().then(
        () => {
          this.items.trigger('save:completed');
        },
        () => {
          this.items.trigger('save:error');
        });
    });
  }
}
