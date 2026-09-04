import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { NavService } from './nav.service';
import { Link } from '../models';

describe('NavService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule]
  }));

  it('should be created', () => {
    const service: NavService = TestBed.inject(NavService);
    expect(service).toBeTruthy();
  });

  it('should resolve a page when the route path matches the final segment of a registered nav URL', () => {
    const service: NavService = TestBed.inject(NavService);
    const page = new Link({ code: 'about', title: 'About', url: '/landing/about' });

    service.navs = [page];
    service.byPath = { '/landing/about': page };

    const resolved = service.getLink('/about');

    expect(resolved).toBeTruthy();
    expect(resolved.code).toBe('about');
  });

  it('should return direct page metadata without requiring a src/ref URL', async () => {
    const service: NavService = TestBed.inject(NavService);
    const page = new Link({
      code: 'about',
      title: 'About',
      meta: {
        layout: {
          sections: [{ code: 'hero', components: [{ control: 'html', value: '<h1>About</h1>' }] }]
        }
      }
    });

    const meta = await service.populateMeta(page);

    expect(meta.layout.sections.length).toBe(1);
    expect(meta.layout.sections[0].components[0].control).toBe('html');
  });

  it('should unwrap metadata returned by a navigation content endpoint', async () => {
    const service: NavService = TestBed.inject(NavService);
    const page = new Link({
      code: 'home',
      id: 'home-id',
      meta: { ref: 'http://localhost:8080/home.json' }
    });
    const http = TestBed.inject(HttpTestingController);
    const request = service.populateMeta(page);
    const response = http.expectOne('http://localhost:8080/home.json');
    response.flush({
      id: 'home-id',
      meta: {
        layout: {
          sections: [{ code: 'hero', components: [{ control: 'html', value: '<h1>Home</h1>' }] }]
        }
      }
    });

    const meta = await request;

    expect(meta.layout.sections[0].components[0].control).toBe('html');
  });
});
