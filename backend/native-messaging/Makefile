FLAGS = -D -m 644
FILE  = com.armaan.quran_locater.json
SOURCE = host-manifest.json
CONFIG = $(or $(XDG_CONFIG_HOME),$(HOME)/.config)

.PHONY: all chromium chrome brave-stable brave-beta brave-dev

all: chromium chrome brave-stable brave-beta brave-dev

chromium:
	install $(FLAGS) $(SOURCE) $(CONFIG)/chromium/NativeMessagingHosts/$(FILE)

chrome:
	install $(FLAGS) $(SOURCE) $(CONFIG)/google-chrome/NativeMessagingHosts/$(FILE)

brave-stable:
	install $(FLAGS) $(SOURCE) $(CONFIG)/BraveSoftware/Brave-Browser/NativeMessagingHosts/$(FILE)

brave-beta:
	install $(FLAGS) $(SOURCE) $(CONFIG)/BraveSoftware/Brave-Browser-Beta/NativeMessagingHosts/$(FILE)

brave-dev:
	install $(FLAGS) $(SOURCE) $(CONFIG)/BraveSoftware/Brave-Browser-Dev/NativeMessagingHosts/$(FILE)
