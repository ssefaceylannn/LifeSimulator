# Xcode projesine gizlilik bildirimini ve yetki dosyasını ekler (CI'da çalışır).
require "xcodeproj"
project = Xcodeproj::Project.open("ios/App/App.xcodeproj")
target = project.targets.find { |t| t.name == "App" }
group = project.main_group.find_subpath("App", false) || project.main_group
unless group.files.any? { |f| f.path == "PrivacyInfo.xcprivacy" }
  ref = group.new_reference("PrivacyInfo.xcprivacy")
  target.resources_build_phase.add_file_reference(ref)
end
group.new_reference("App.entitlements") unless group.files.any? { |f| f.path == "App.entitlements" }
target.build_configurations.each do |c|
  c.build_settings["CODE_SIGN_ENTITLEMENTS"] = "App/App.entitlements"
  c.build_settings["TARGETED_DEVICE_FAMILY"] = "1"
end
project.save
puts "PrivacyInfo.xcprivacy ve App.entitlements eklendi"
