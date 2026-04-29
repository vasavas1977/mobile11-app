require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = 'EsimInstaller'
  s.version      = package['version']
  s.summary      = package['description']
  s.license      = 'MIT'
  s.homepage     = 'https://mobile11.com'
  s.author       = 'Mobile11'
  s.source       = { :git => 'https://github.com/nicozica/mobile11-app.git', :tag => s.version.to_s }
  s.source_files = 'ios/Plugin/**/*.{swift,h,m,c,cc,mm,cpp}'
  s.ios.deployment_target = '14.0'
  s.dependency 'Capacitor'
  s.swift_version = '5.9'
end
