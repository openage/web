import { TestBed } from '@angular/core/testing';

import { DataService } from './data.service';

describe('DataService', () => {
  let service: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should use nested source configuration when searching', async () => {
    const options = {
      page: { skip: 0, limit: 10 },
      config: { service: 'system', collection: 'applications' }
    };
    const normalizedOptions = {
      service: 'system',
      collection: 'applications',
      page: options.page
    };
    const search = jasmine.createSpy('search').and.returnValue(Promise.resolve({ items: [] }));
    const plugin = {
      canHandle: () => true,
      create: async () => ({}),
      search,
      get: async () => ({}),
      update: async () => ({}),
      remove: async () => true
    };
    spyOn(service.dataSourceRegistry, 'getPlugin').and.returnValue(plugin);

    await service.search({}, options);

    expect(service.dataSourceRegistry.getPlugin).toHaveBeenCalledWith(normalizedOptions);
    expect(search).toHaveBeenCalledWith({}, normalizedOptions);
    expect(service.context.isProcessing()).toBeFalse();
  });

  it('should clear processing state when data source configuration is missing', async () => {
    await expectAsync(service.search()).toBeRejectedWithError('Data source must specify a URL, service, or provider.');

    expect(service.context.isProcessing()).toBeFalse();
  });
});
