import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { StringService } from './string.service';
import { Logger } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DataSourceService {

  logger = new Logger(DataSourceService);

  constructor(
    private stringService: StringService,
    // private auth: RoleService,
    private httpClient: HttpClient
  ) { }

  extractContext() {
    const current = {}

    // current['session'] = this.auth.currentSession()
    // current['tenant'] = this.auth.currentTenant()
    // current['organization'] = this.auth.currentOrganization()
    // current['user'] = this.auth.currentUser()
    // current['role'] = this.auth.currentRole()

    return current
  }

  buildUrl(data: any, injectorData: any) {
    // let url = data
    // const services = this.auth.currentApplication().services

    // if (url.startsWith(':')) {
    //   let serviceCode = url.split('/')[0].substr(1)
    //   if (serviceCode.startsWith('$')) {
    //     serviceCode = JSON.parse(this.stringService.inject(JSON.stringify(serviceCode), injectorData))
    //     const parts = url.split('/')
    //     parts[0] = `:${serviceCode}`
    //     url = parts.join('/')
    //   }
    //   let service = services.find((s) => s.code == serviceCode)
    //   url = url.replace(`:${serviceCode}`, service.url)
    // }

    // return JSON.parse(this.stringService.inject(JSON.stringify(url), injectorData))
  }

  buildPayload(body: any, injectorData: any) {
    let payload = {}

    if (body) {
      payload = JSON.parse(this.stringService.inject(JSON.stringify(body), injectorData))

      const removeEmpty = (obj: any) => {
        for (const key of Object.keys(obj)) {
          const value = obj[key]
          if (value && typeof value === 'object') {
            obj[key] = removeEmpty(value)
          }

          if (value === 'undefined') {
            obj[key] = undefined
          } else if (value === 'null') {
            obj[key] = null
          }
        }
        return obj
      }

      payload = removeEmpty(payload)
    }

    return payload
  }

  async execute(source: any, method?: any): Promise<any> {
    const current = this.extractContext()
    method = method || 'get'

    if (!source.dataSource) {
      return this.convertToArray(source, current)
    }

    const promises = []
    const providers = Array.isArray(source.dataSource) ? source.dataSource : [source.dataSource] // Data Source providers

    const response = {}
    for (const provider of providers) {
      if (provider.connectionString) {
        const injectorData = {
          params: provider.params,
          data: source.data,
          context: current,
          response: response
        }

        const payload = {
          type: provider.type,
          connectionString: this.buildUrl(provider.connectionString, injectorData),
          config: this.buildPayload(provider.config, injectorData),
          key: provider.key,
          data: source.data,
          params: provider.params,
          field: provider.field
        }

        switch (method) {
          case 'put':
            await this.putToUrl(payload).then((result) => {
              if (result) { Object.assign(response, result) }
            }).catch(err => { this.logger.error(err) })
            break
          case 'get':
            await this.getFromUrl(payload).then((result) => {
              if (result) { Object.assign(response, result) }
            }).catch(err => { this.logger.error(err) })
            break
        }
      }
    }

    // await Promise.all(promises).then((results) => {
    //   if (results.length > 1) {
    //     data = {}
    //     results.forEach((r) => Object.assign(data, r))
    //   } else {
    //     data = results[0]
    //   }
    // }).catch(err => {
    //   logger.error(err)
    // })

    return this.convertToArray(response, current)
  }

  putToUrl(source: any) {
    const http = this.httpClient
    return new Promise(function (resolve, reject) {
      const body = (source.key && source.data && source.data[source.key]) ? source.data[source.key] : {}

      return http.put(source.connectionString, body, { headers: source.config.headers }).subscribe((res: any) => {
        if (res.IsSuccess || res.isSuccess) {
          const data = source.field ? source.field.split('.').reduce((obj: any, level: any) => obj && obj[level], res) : res.data || res.items
          if (source.key) {
            return resolve({ [source.key]: data })
          }
          resolve(data)
        } else {
          return reject(res.error || res.message || 'server did not return isSuccess')
        }
      })
    })
  }

  getFromUrl(source: any): Promise<any> {
    const http = this.httpClient

    return new Promise(function (resolve, reject) {
      http.get(source.connectionString, { headers: source.config.headers }).subscribe((res: any) => {
        if (res.IsSuccess || res.isSuccess) {
          const data = source.field ? source.field.split('.').reduce((obj: any, level: any) => obj && obj[level], res) : res.data || res.items
          if (source.key) {
            return resolve({ [source.key]: data })
          }
          resolve(data)
        } else {
          return reject(res.error || 'server did not return isSuccess')
        }
      })
    })
  }

  convertToArray(data: any, current: any) {
    let items = []
    if (Array.isArray(data)) {
      items = data.map(i => {
        i.context = current
        return i
      })
    } else if (data) {
      data.context = current
      items.push(data)
    }

    return items
  }

}
